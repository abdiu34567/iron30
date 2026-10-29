import { Bot, InlineKeyboard, GrammyError, HttpError } from 'grammy';
import cron from 'node-cron';
import { ChallengeService } from '../services/challengeService';

let botInstance: Bot | null = null;

/**
 * Creates the appropriate keyboard for private chats vs group chats.
 * NOTE: Telegram Bot API prohibits `web_app` buttons in group chats (error 400 BUTTON_TYPE_INVALID).
 * In groups, a `url` button pointing to `https://t.me/BotUsername/app` must be used instead,
 * which opens the Telegram Mini App natively in the group sheet!
 */
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

    // Handle /start, /app, /hub, /challenge commands
    bot.command(['start', 'app', 'hub', 'challenge'], async (ctx) => {
      const isPrivate = ctx.chat?.type === 'private';
      const botUsername = ctx.me.username || 'Iron30Bot';
      const startParam = ctx.match?.trim();
      const keyboard = createAppKeyboard(botUsername, webAppUrl, isPrivate, startParam);

      let msg = `🛡️ *Iron30 Challenge Hub*\n\nTrack your progress, view the group leaderboard, and inspect your friends' 30-day consistency heatmaps.\n\nTap below to open the app anytime! 👇`;

      if (startParam) {
        try {
          const challenge = await ChallengeService.getChallengeById(startParam);
          if (challenge) {
            msg =
              `🔥 *You've been invited to join "${challenge.title}"!*\n\n` +
              `🎯 *Squad Target*: ${challenge.targetCount.toLocaleString()} ${challenge.unit}\n` +
              `📊 *Daily Goal*: ${challenge.dailyGoal.toLocaleString()} ${challenge.unit} / day\n` +
              `📅 *Duration*: ${challenge.durationDays} Days\n` +
              `👥 *Current Squad*: ${challenge.participantCount} members\n\n` +
              `Tap below to accept the challenge and start logging your progress! 👇`;
          }
        } catch (e) {
          console.warn('Failed to fetch challenge for /start param:', e);
        }
      }

      await ctx.reply(msg, {
        parse_mode: 'Markdown',
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
            const firstChallenge = activeChallenges[0];
            const botInfo = await bot.api.getMe();
            // Since this message goes to a group, isPrivate is false
            const keyboard = createAppKeyboard(
              botInfo.username,
              webAppUrl,
              false,
              firstChallenge._id.toString()
            );

            await bot.api.sendMessage(
              groupChatId,
              `☀️ *Good morning team!* Day check-in time!\n\n` +
                `🎯 *Active Challenge*: ${firstChallenge.title}\n` +
                `📊 *Daily Target*: ${firstChallenge.dailyGoal} ${firstChallenge.unit}\n` +
                `👥 *Participants*: ${firstChallenge.participantCount}\n\n` +
                `Tap below to log your reps and see where your friends stand! 👇`,
              {
                parse_mode: 'Markdown',
                reply_markup: keyboard,
              }
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
