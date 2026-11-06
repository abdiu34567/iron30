import { Bot, InlineKeyboard, GrammyError, HttpError } from 'grammy';
import cron from 'node-cron';
import { ChallengeService } from '../services/challengeService';

let botInstance: Bot | null = null;

function getChallengeDayBadge(startDate: Date | string, durationDays: number): string {
  const startDateStr =
    typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(startDate)
      ? startDate.slice(0, 10)
      : new Date(startDate).toISOString().slice(0, 10);
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const startUtc = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0));

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const [ty, tm, td] = [year, month, day].map(Number);
  const todayUtc = new Date(Date.UTC(ty, tm - 1, td, 0, 0, 0));

  const dayDiff = Math.round((todayUtc.getTime() - startUtc.getTime()) / (1000 * 60 * 60 * 24));
  if (dayDiff < 0) {
    const daysUntil = Math.abs(dayDiff);
    return `Starts in ${daysUntil}d`;
  }
  const dayNumber = Math.min(durationDays, dayDiff + 1);
  return `Day ${dayNumber}/${durationDays}`;
}

function formatChallengeDigest(challenges: any[]): string {
  if (challenges.length === 1) {
    const c = challenges[0];
    const badge = getChallengeDayBadge(c.startDate, c.durationDays);
    return (
      `☀️ *Good morning team!* Daily check-in time!\n\n` +
      `🎯 *Active Challenge*: ${c.title} (${badge})\n` +
      `📊 *Daily Target*: ${c.dailyGoal.toLocaleString()} ${c.unit} / day\n` +
      `👥 *Participants*: ${c.participantCount} members\n\n` +
      `Consistency is everything. Tap below to log your progress! 👇`
    );
  }

  let text = `☀️ *Good morning team!* Daily check-in briefing!\n\nHere are your squad's active challenges:\n\n`;
  challenges.forEach((c, index) => {
    const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][index] || '🎯';
    const badge = getChallengeDayBadge(c.startDate, c.durationDays);
    const icon = c.unit === 'pushups' ? '🏋️' : c.unit === 'trades' ? '📈' : '🎯';
    text += `${numEmoji} ${icon} *${c.title}* (${badge})\n`;
    text += `   🎯 *Goal*: ${c.dailyGoal.toLocaleString()} ${c.unit}/day · 👥 *Squad*: ${c.participantCount}\n\n`;
  });
  text += `Tap any challenge below to log today's progress! 👇`;
  return text;
}

function createMultiChallengeKeyboard(
  botUsername: string,
  webAppUrl: string,
  isPrivate: boolean,
  challenges: any[]
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const appShortName = process.env.TELEGRAM_APP_SHORT_NAME || 'app';

  challenges.forEach((c) => {
    const icon = c.unit === 'pushups' ? '🏋️' : c.unit === 'trades' ? '📈' : '🎯';
    const shortTitle = c.title.length > 20 ? `${c.title.slice(0, 18)}…` : c.title;
    const btnLabel = `${icon} ${shortTitle}`;

    if (isPrivate && webAppUrl.startsWith('https://')) {
      keyboard.webApp(btnLabel, `${webAppUrl}?challengeId=${c._id.toString()}`).row();
    } else {
      keyboard.url(btnLabel, `https://t.me/${botUsername}/${appShortName}?startapp=${c._id.toString()}`).row();
    }
  });

  if (isPrivate && webAppUrl.startsWith('https://')) {
    keyboard.webApp('🛡️ Open Challenge Hub', webAppUrl);
  } else {
    keyboard.url('🛡️ Open Challenge Hub', `https://t.me/${botUsername}/${appShortName}`);
  }

  return keyboard;
}

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

    // Handle /start, /app, /hub, /challenge, /challenges commands
    bot.command(['start', 'app', 'hub', 'challenge', 'challenges'], async (ctx) => {
      const isPrivate = ctx.chat?.type === 'private';
      const botUsername = ctx.me.username || 'Iron30Bot';
      const startParam = ctx.match?.trim();

      if (startParam) {
        try {
          const challenge = await ChallengeService.getChallengeById(startParam);
          if (challenge) {
            const badge = getChallengeDayBadge(challenge.startDate, challenge.durationDays);
            const msg =
              `🔥 *You've been invited to join "${challenge.title}"!*\n\n` +
              `🎯 *Squad Target*: ${challenge.targetCount.toLocaleString()} ${challenge.unit}\n` +
              `📊 *Daily Goal*: ${challenge.dailyGoal.toLocaleString()} ${challenge.unit} / day\n` +
              `📅 *Timeline*: ${badge} (${challenge.durationDays} Days)\n` +
              `👥 *Current Squad*: ${challenge.participantCount} members\n\n` +
              `Tap below to accept the challenge and start logging your progress! 👇`;
            const keyboard = createAppKeyboard(botUsername, webAppUrl, isPrivate, startParam);
            await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: keyboard });
            return;
          }
        } catch (e) {
          console.warn('Failed to fetch challenge for /start param:', e);
        }
      }

      // Default or /challenges command: show all active challenges with direct quick-action buttons
      try {
        const activeChallenges = await ChallengeService.getChallenges('active');
        if (activeChallenges.length > 0) {
          const msg = formatChallengeDigest(activeChallenges);
          const keyboard = createMultiChallengeKeyboard(
            botUsername,
            webAppUrl,
            isPrivate,
            activeChallenges
          );
          await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: keyboard });
          return;
        }
      } catch (e) {
        console.warn('Failed to fetch active challenges for /challenges:', e);
      }

      const keyboard = createAppKeyboard(botUsername, webAppUrl, isPrivate);
      const msg = `🛡️ *Iron30 Challenge Hub*\n\nTrack your progress, view group leaderboards, and inspect your friends' consistency heatmaps.\n\nTap below to open the app anytime! 👇`;
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
            const botInfo = await bot.api.getMe();
            const msg = formatChallengeDigest(activeChallenges);
            // Since this message goes to a group, isPrivate is false
            const keyboard = createMultiChallengeKeyboard(
              botInfo.username,
              webAppUrl,
              false,
              activeChallenges
            );

            await bot.api.sendMessage(groupChatId, msg, {
              parse_mode: 'Markdown',
              reply_markup: keyboard,
            });
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
