import { Bot, InlineKeyboard } from 'grammy';
import cron from 'node-cron';
import { ChallengeService } from '../services/challengeService';

let botInstance: Bot | null = null;

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

    // Handle /start command
    bot.command('start', async (ctx) => {
      const keyboard = new InlineKeyboard().webApp('🛡️ Open Iron30', webAppUrl);

      await ctx.reply(
        `👋 Welcome to *Iron30*!\n\nForge unbreakable habits & challenges with your friends, log your daily progress, and stay accountable.\n\nTap below to open the app! 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        }
      );
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
            const keyboard = new InlineKeyboard().webApp(
              '💪 Open Challenge & Check In',
              `${webAppUrl}?challengeId=${firstChallenge._id}`
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
      console.error('Telegram bot error:', err);
    });

    bot.start({
      onStart: (botInfo) => {
        console.log(`🤖 Telegram Bot started as @${botInfo.username}`);
      },
    });

    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram Bot:', error);
    return null;
  }
}

export function getBot(): Bot | null {
  return botInstance;
}
