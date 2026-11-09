import { Bot, InlineKeyboard, GrammyError, HttpError } from 'grammy';
import cron from 'node-cron';
import { ChallengeService } from '../services/challengeService';
import {
  LiveBriefingService,
  getChallengeDayBadge,
  createMultiChallengeKeyboard,
  escapeHtml,
} from '../services/liveBriefingService';

let botInstance: Bot | null = null;



function createAppKeyboard(
  botUsername: string,
  webAppUrl: string,
  isPrivate: boolean,
  param?: string
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const appShortName = process.env.TELEGRAM_APP_SHORT_NAME || 'app';

  if (isPrivate && webAppUrl.startsWith('https://')) {
    // In private chats with the bot, native web_app button is allowed
    const finalUrl = param ? `${webAppUrl}?challengeId=${param}` : webAppUrl;
    keyboard.webApp('🛡️ Open Iron30', finalUrl);
  } else {
    // In groups/supergroups/channels, Telegram Bot API ONLY allows 'url' buttons!
    const directUrl = param
      ? `https://t.me/${botUsername}/${appShortName}?startapp=${param}`
      : `https://t.me/${botUsername}/${appShortName}`;
    keyboard.url('🛡️ Open Iron30', directUrl);
  }
  return keyboard;
}

export function setupBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token === 'dummy_token_for_development' || token === 'your_telegram_bot_token_here') {
    console.log('ℹ️  No live Telegram bot token provided. Bot features will run in mock mode.');
    return null;
  }

  try {
    const bot = new Bot(token);
    botInstance = bot;

    const webAppUrl = process.env.WEBAPP_URL || 'https://t.me';

    // Handle /start, /app, /hub, /challenge, /challenges, /briefing, /today commands
    bot.command(['start', 'app', 'hub', 'challenge', 'challenges', 'briefing', 'today'], async (ctx) => {
      const isPrivate = ctx.chat?.type === 'private';
      const botUsername = ctx.me.username || 'Iron30Bot';
      const startParam = ctx.match?.trim();

      if (startParam) {
        try {
          const challenge = await ChallengeService.getChallengeById(startParam);
          if (challenge) {
            const badge = getChallengeDayBadge(challenge.startDate, challenge.durationDays);
            const msg =
              `🔥 <b>You've been invited to join "${escapeHtml(challenge.title)}"!</b>\n\n` +
              `🎯 <b>Squad Target</b>: ${challenge.targetCount.toLocaleString()} ${escapeHtml(challenge.unit)}\n` +
              `📊 <b>Daily Goal</b>: ${challenge.dailyGoal.toLocaleString()} ${escapeHtml(challenge.unit)} / day\n` +
              `📅 <b>Timeline</b>: ${badge} (${challenge.durationDays} Days)\n` +
              `👥 <b>Current Squad</b>: ${challenge.participantCount} members\n\n` +
              `Tap below to accept the challenge and start logging your progress! 👇`;
            const keyboard = createAppKeyboard(botUsername, webAppUrl, isPrivate, startParam);
            await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
            return;
          }
        } catch (e) {
          console.warn('Failed to fetch challenge for /start param:', e);
        }
      }

      // Default or /challenges /briefing /today command: show live social pressure briefing
      try {
        const activeChallenges = await ChallengeService.getChallenges('active');
        if (activeChallenges.length > 0) {
          const msg = await LiveBriefingService.generateSocialPressureDigest(activeChallenges);
          const keyboard = createMultiChallengeKeyboard(
            botUsername,
            webAppUrl,
            isPrivate,
            activeChallenges
          );
          const sent = await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });

          // Track this briefing so subsequent check-ins dynamically edit this exact message in real-time!
          await LiveBriefingService.recordBriefing(
            ctx.chat.id,
            sent.message_id,
            isPrivate,
            activeChallenges.map((c) => c._id)
          );
          return;
        }
      } catch (e) {
        console.warn('Failed to fetch active challenges for /challenges:', e);
      }

      const keyboard = createAppKeyboard(botUsername, webAppUrl, isPrivate);
      const msg = `🛡️ <b>Iron30 Challenge Hub</b>\n\nTrack your progress, view group leaderboards, and inspect your friends' consistency heatmaps.\n\nTap below to open the app anytime! 👇`;
      await ctx.reply(msg, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    });

    // Schedule 1-time daily group message
    const cronSchedule = process.env.DAILY_MESSAGE_CRON || '0 9 * * *'; // 09:00 AM daily
    const groupChatId = process.env.GROUP_CHAT_ID;

    if (groupChatId) {
      cron.schedule(cronSchedule, async () => {
        try {
          console.log('⏰ Running daily scheduled group challenge reminder...');
          const activeChallenges = await ChallengeService.getChallenges('active');

          if (activeChallenges.length > 0) {
            const botInfo = await bot.api.getMe();
            const msg = await LiveBriefingService.generateSocialPressureDigest(activeChallenges);
            // Since this message goes to a group, isPrivate is false
            const keyboard = createMultiChallengeKeyboard(
              botInfo.username,
              webAppUrl,
              false,
              activeChallenges
            );

            const sent = await bot.api.sendMessage(groupChatId, msg, {
              parse_mode: 'HTML',
              reply_markup: keyboard,
            });

            // Track daily group message for live micro-updates
            await LiveBriefingService.recordBriefing(
              Number(groupChatId),
              sent.message_id,
              false,
              activeChallenges.map((c) => c._id)
            );
          }
        } catch (err) {
          console.error('Error dispatching daily group message:', err);
        }
      });
      console.log(`⏰ Daily group cron scheduled (${cronSchedule}) for group ${groupChatId}`);
    }

    bot.catch((err) => {
      const e = err.error;
      if (e instanceof GrammyError && e.error_code === 409) {
        console.warn('⚠️ Polling conflict (409) during deploy rollover. Reconnecting cleanly...');
        return;
      }
      console.error('Telegram bot error:', err);
    });

    // Graceful shutdown on Render deploy rollover (SIGTERM / SIGINT)
    const stopBot = () => {
      console.log('🛑 Stopping Telegram bot polling for deploy rollover...');
      try {
        bot.stop();
      } catch (e) {
        // Ignore stop error
      }
    };
    process.once('SIGINT', stopBot);
    process.once('SIGTERM', stopBot);

    // Start bot with automatic retry if a 409 Conflict occurs during deploy handover
    const startPolling = async (retryCount = 0) => {
      try {
        await bot.start({
          drop_pending_updates: true, // Clears stale connections and drops pending conflict backlog
          onStart: (botInfo) => {
            console.log(`🤖 Telegram Bot started as @${botInfo.username}`);
          },
        });
      } catch (err: any) {
        if (
          err?.error_code === 409 ||
          err?.description?.includes('terminated by other getUpdates') ||
          err?.message?.includes('409')
        ) {
          if (retryCount < 5) {
            console.warn(
              `⚠️ Telegram bot polling conflict (409) during deploy handover. Retrying in 4s... (attempt ${retryCount + 1})`
            );
            setTimeout(() => startPolling(retryCount + 1), 4000);
            return;
          }
        }
        console.error('Fatal bot polling error:', err);
      }
    };

    startPolling();

    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram Bot:', error);
    return null;
  }
}

export function getBot(): Bot | null {
  return botInstance;
}
