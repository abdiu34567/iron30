import { Types } from 'mongoose';
import { InlineKeyboard } from 'grammy';
import { LiveBriefing, ILiveBriefing } from '../models/LiveBriefing';
import { Participant } from '../models/Participant';
import { CheckInLog } from '../models/CheckInLog';
import { ChallengeService } from './challengeService';
import { ProgressService } from './progressService';
import { getBot } from '../bot/bot';

export function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getChallengeDayBadge(startDate: Date | string, durationDays: number): string {
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

export function createMultiChallengeKeyboard(
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

export async function generateSocialPressureDigest(challenges: any[]): Promise<string> {
  const todayStr = ProgressService.formatDate(new Date());

  const challengeBlocks: string[] = [];

  for (let i = 0; i < challenges.length; i++) {
    const c = challenges[i];
    const numEmoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i] || '🎯';
    const badge = getChallengeDayBadge(c.startDate, c.durationDays);
    const icon = c.unit === 'pushups' ? '🏋️' : c.unit === 'trades' ? '📈' : '🎯';

    // Fetch participants sorted by totalProgress descending
    const participants = await Participant.find({ challengeId: c._id })
      .sort({ totalProgress: -1 })
      .lean();

    // Fetch today's check-in logs for this challenge
    const todayLogs = await CheckInLog.find({
      challengeId: c._id,
      date: todayStr,
    }).lean();

    const loggedUserMap = new Map<number, number>();
    todayLogs.forEach((l) => {
      const prev = loggedUserMap.get(l.userId) || 0;
      loggedUserMap.set(l.userId, Math.round((prev + l.count) * 100) / 100);
    });

    const loggedParticipants = participants.filter((p) => loggedUserMap.has(p.userId));
    const waitingParticipants = participants.filter((p) => !loggedUserMap.has(p.userId));

    // Leader info
    const leader = participants[0];
    let leadText = 'First place is open!';
    if (leader && leader.totalProgress !== 0) {
      let leadAmt: string;
      if (c.unit === 'trades') {
        leadAmt = leader.totalProgress >= 0 ? `+$${leader.totalProgress}` : `-$${Math.abs(leader.totalProgress)}`;
      } else {
        leadAmt = `${leader.totalProgress.toLocaleString()} ${escapeHtml(c.unit)}`;
      }
      leadText = `${escapeHtml(leader.userName.split(' ')[0])} (${leadAmt})`;
    }

    const totalSquad = participants.length;
    const loggedCount = loggedParticipants.length;

    let block = `${numEmoji} ${icon} <b>${escapeHtml(c.title)}</b> (${escapeHtml(badge)})\n`;
    block += `👑 <b>Lead</b>: ${leadText} · 🔥 <b>Logged today</b>: ${loggedCount}/${totalSquad}\n`;

    if (totalSquad === 0) {
      block += `⚠️ <i>No squad members yet. Tap below to join!</i>\n`;
    } else if (loggedCount === totalSquad) {
      block += `🎉 <b>Squad Crushed It!</b> All ${totalSquad} members checked in today! ⚡\n`;
    } else {
      if (loggedParticipants.length > 0) {
        const doneNames = loggedParticipants
          .slice(0, 5)
          .map((p) => `✅ ${escapeHtml(p.userName.split(' ')[0])}`)
          .join(' ');
        block += `${doneNames}\n`;
      }

      // Waiting on names (with @username if available, otherwise first name)
      const waitingTags = waitingParticipants.map((p) => {
        if (p.username) {
          return `@${escapeHtml(p.username)}`;
        }
        return escapeHtml(p.userName.split(' ')[0]);
      });

      if (waitingTags.length <= 3) {
        block += `⚠️ <b>Waiting on</b>: ${waitingTags.join(', ')}\n`;
      } else {
        const shown = waitingTags.slice(0, 2).join(', ');
        const remaining = waitingTags.length - 2;
        block += `⚠️ <b>Waiting on</b>: ${shown}, +${remaining} others\n`;
      }
    }

    challengeBlocks.push(block);
  }

  return (
    `☀️ <b>Squad Daily Briefing &amp; Live Check-In</b>\n\n` +
    challengeBlocks.join('\n') +
    `\nTap your challenge below to log reps and put a ✅ by your name! 👇`
  );
}

export class LiveBriefingService {
  private static pendingEdits = new Map<string, NodeJS.Timeout>();

  /**
   * Record a sent briefing message so it can be dynamically edited on check-in
   */
  static async recordBriefing(
    chatId: number,
    messageId: number,
    isPrivate: boolean,
    challengeIds: (Types.ObjectId | string)[]
  ): Promise<void> {
    const todayStr = ProgressService.formatDate(new Date());
    await LiveBriefing.findOneAndUpdate(
      { chatId, date: todayStr },
      {
        chatId,
        messageId,
        date: todayStr,
        isPrivate,
        challengeIds,
        lastEditedAt: new Date(),
      },
      { upsert: true, new: true }
    ).exec();
  }

  /**
   * Generates the social pressure digest text
   */
  static generateSocialPressureDigest = generateSocialPressureDigest;

  /**
   * Updates all active Telegram briefings for today when someone checks in
   */
  static async updateBriefingsForChallenge(challengeId: string | Types.ObjectId): Promise<void> {
    const todayStr = ProgressService.formatDate(new Date());

    // Find all active briefings recorded for today
    const briefings = await LiveBriefing.find({
      date: todayStr,
    }).exec();

    if (!briefings || briefings.length === 0) return;

    const bot = getBot();
    if (!bot) return;

    let botUsername = process.env.TELEGRAM_BOT_USERNAME || 'Iron30Bot';
    try {
      const botInfo = await bot.api.getMe();
      if (botInfo?.username) botUsername = botInfo.username;
    } catch (e) {}

    const webAppUrl = process.env.WEBAPP_URL || 'https://t.me';

    // Fetch all active challenges
    const activeChallenges = await ChallengeService.getChallenges('active');
    if (activeChallenges.length === 0) return;

    for (const briefing of briefings) {
      const editKey = `${briefing.chatId}_${briefing.messageId}`;

      // Debounce rapid check-ins: wait 350ms before dispatching edit to Telegram
      const existingTimer = this.pendingEdits.get(editKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        LiveBriefingService.pendingEdits.delete(editKey);
        try {
          const updatedText = await generateSocialPressureDigest(activeChallenges);
          const keyboard = createMultiChallengeKeyboard(
            botUsername,
            webAppUrl,
            briefing.isPrivate,
            activeChallenges
          );

          await bot.api.editMessageText(briefing.chatId, briefing.messageId, updatedText, {
            parse_mode: 'HTML',
            reply_markup: keyboard,
          });

          await LiveBriefing.findByIdAndUpdate(briefing._id, { lastEditedAt: new Date() }).exec();
        } catch (err: any) {
          // Safe error handling for Telegram Bot API
          if (
            err?.description?.includes('message is not modified') ||
            err?.message?.includes('not modified')
          ) {
            // Expected when new text is identical - ignore cleanly
            return;
          }

          if (
            err?.description?.includes('message to edit not found') ||
            err?.description?.includes('chat not found') ||
            err?.error_code === 400 ||
            err?.error_code === 403
          ) {
            // Message was deleted or bot was removed from chat - clean up DB record
            await LiveBriefing.findByIdAndDelete(briefing._id).exec();
            return;
          }

          console.warn(`[LiveBriefing] Failed to edit message ${briefing.messageId} in chat ${briefing.chatId}:`, err.message);
        }
      }, 350);

      this.pendingEdits.set(editKey, timer);
    }
  }
}
