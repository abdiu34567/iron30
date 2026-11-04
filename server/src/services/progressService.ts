import { Types } from 'mongoose';
import { Participant, IParticipant } from '../models/Participant';
import { CheckInLog, ICheckInLog } from '../models/CheckInLog';
import { Challenge, IChallenge } from '../models/Challenge';

export interface DayHeatmapItem {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  targetCount: number;
  loggedCount: number;
  status: 'completed' | 'partial' | 'missed' | 'future' | 'today';
  tradeOutcome?: 'win' | 'loss' | 'breakeven' | 'mixed';
  winCount?: number;
  lossCount?: number;
}

export interface FriendProgressSummary {
  participant: {
    userId: number;
    userName: string;
    username?: string;
    photoUrl?: string;
    totalProgress: number;
    targetCount: number;
    progressPercentage: number;
    currentStreak: number;
    bestStreak: number;
    status: string;
    joinedAt: Date;
  };
  stats: {
    dailyAverage: number;
    daysElapsed: number;
    daysRemaining: number;
    expectedProgress: number;
    isOnTrack: boolean;
    remainingToGoal: number;
    tradeStats?: {
      winCount: number;
      lossCount: number;
      breakevenCount: number;
      totalTrades: number;
      winRate: number;
    };
  };
  heatmap: DayHeatmapItem[];
  recentLogs: Array<{
    id: string;
    count: number;
    date: string;
    note?: string;
    tradeOutcome?: 'win' | 'loss' | 'breakeven';
    createdAt: Date;
  }>;
}

export class ProgressService {
  /**
   * Helper to format a Date object into YYYY-MM-DD in UTC-consistent string
   */
  static formatDate(d: Date): string {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Fetch full detailed progress for a specific participant in a challenge
   */
  static async getParticipantProgress(
    challengeId: string | Types.ObjectId,
    userId: number
  ): Promise<FriendProgressSummary | null> {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return null;

    const participant = await Participant.findOne({ challengeId, userId });
    if (!participant) return null;

    // Fetch all logs for this participant in this challenge
    const logs = await CheckInLog.find({ challengeId, userId }).sort({ createdAt: -1 });

    const isTradeChallenge = challenge.unit?.toLowerCase().includes('trade') || false;

    // Aggregate daily counts & trade outcomes
    const dailyMap = new Map<string, number>();
    const dailyTradesMap = new Map<string, { wins: number; losses: number; breakevens: number }>();
    let totalWins = 0;
    let totalLosses = 0;
    let totalBreakevens = 0;

    for (const log of logs) {
      const prev = dailyMap.get(log.date) || 0;
      dailyMap.set(log.date, prev + log.count);

      if (log.tradeOutcome) {
        const tradeDay = dailyTradesMap.get(log.date) || { wins: 0, losses: 0, breakevens: 0 };
        if (log.tradeOutcome === 'win') {
          tradeDay.wins += 1;
          totalWins += 1;
        } else if (log.tradeOutcome === 'loss') {
          tradeDay.losses += 1;
          totalLosses += 1;
        } else if (log.tradeOutcome === 'breakeven') {
          tradeDay.breakevens += 1;
          totalBreakevens += 1;
        }
        dailyTradesMap.set(log.date, tradeDay);
      }
    }

    const now = new Date();
    const todayStr = this.formatDate(now);
    const startDate = new Date(challenge.startDate);
    const duration = challenge.durationDays;
    const dailyGoal = challenge.dailyGoal;

    // Generate the challenge duration heatmap
    const heatmap: DayHeatmapItem[] = [];
    for (let dayIndex = 0; dayIndex < duration; dayIndex++) {
      const dayDate = new Date(startDate);
      dayDate.setUTCDate(startDate.getUTCDate() + dayIndex);
      const dateStr = this.formatDate(dayDate);

      const logged = dailyMap.get(dateStr) || 0;

      let status: 'completed' | 'partial' | 'missed' | 'future' | 'today';
      if (dateStr > todayStr) {
        status = 'future';
      } else if (dateStr === todayStr) {
        if (logged >= dailyGoal) {
          status = 'completed';
        } else if (logged > 0) {
          status = 'partial';
        } else {
          // Today is active and in progress!
          status = 'today';
        }
      } else {
        // Genuinely passed day
        if (logged >= dailyGoal) {
          status = 'completed';
        } else if (logged > 0) {
          status = 'partial';
        } else {
          status = 'missed';
        }
      }

      let dayTradeOutcome: 'win' | 'loss' | 'breakeven' | 'mixed' | undefined;
      let winCount: number | undefined;
      let lossCount: number | undefined;

      if (isTradeChallenge) {
        const dayTrades = dailyTradesMap.get(dateStr);
        if (dayTrades) {
          winCount = dayTrades.wins;
          lossCount = dayTrades.losses;
          if (dayTrades.wins > 0 && dayTrades.losses === 0 && dayTrades.breakevens === 0) {
            dayTradeOutcome = 'win';
          } else if (dayTrades.losses > 0 && dayTrades.wins === 0 && dayTrades.breakevens === 0) {
            dayTradeOutcome = 'loss';
          } else if (dayTrades.breakevens > 0 && dayTrades.wins === 0 && dayTrades.losses === 0) {
            dayTradeOutcome = 'breakeven';
          } else if (dayTrades.wins + dayTrades.losses + dayTrades.breakevens > 0) {
            dayTradeOutcome = 'mixed';
          }
        }
      }

      heatmap.push({
        dayNumber: dayIndex + 1,
        date: dateStr,
        targetCount: dailyGoal,
        loggedCount: logged,
        status,
        ...(isTradeChallenge ? { tradeOutcome: dayTradeOutcome, winCount, lossCount } : {}),
      });
    }

    // Calculate pace and metrics based on calendar days
    let daysElapsed = 0;
    const startStr = this.formatDate(startDate);
    if (todayStr >= startStr) {
      const [sy, sm, sd] = startStr.split('-').map(Number);
      const [ty, tm, td] = todayStr.split('-').map(Number);
      const startUtc = Date.UTC(sy, sm - 1, sd);
      const todayUtc = Date.UTC(ty, tm - 1, td);
      const diffDays = Math.round((todayUtc - startUtc) / (1000 * 60 * 60 * 24));
      daysElapsed = Math.min(duration, Math.max(1, diffDays + 1));
    }
    const daysRemaining = Math.max(0, duration - daysElapsed);
    const expectedProgress = Math.min(challenge.targetCount, daysElapsed * dailyGoal);
    const remainingToGoal = Math.max(0, challenge.targetCount - participant.totalProgress);
    const dailyAverage = daysElapsed > 0 ? Math.round(participant.totalProgress / daysElapsed) : 0;
    const isOnTrack = participant.totalProgress >= expectedProgress;
    const progressPercentage = Math.min(
      100,
      Math.round((participant.totalProgress / challenge.targetCount) * 100)
    );

    const totalDecidedTrades = totalWins + totalLosses;
    const winRate = totalDecidedTrades > 0 ? Math.round((totalWins / totalDecidedTrades) * 100) : 0;
    const totalTrades = totalWins + totalLosses + totalBreakevens;

    return {
      participant: {
        userId: participant.userId,
        userName: participant.userName,
        username: participant.username,
        photoUrl: participant.photoUrl,
        totalProgress: participant.totalProgress,
        targetCount: challenge.targetCount,
        progressPercentage,
        currentStreak: participant.currentStreak,
        bestStreak: participant.bestStreak,
        status: participant.status,
        joinedAt: participant.joinedAt,
      },
      stats: {
        dailyAverage,
        daysElapsed,
        daysRemaining,
        expectedProgress,
        isOnTrack,
        remainingToGoal,
        ...(isTradeChallenge ? {
          tradeStats: {
            winCount: totalWins,
            lossCount: totalLosses,
            breakevenCount: totalBreakevens,
            totalTrades,
            winRate,
          },
        } : {}),
      },
      heatmap,
      recentLogs: logs.slice(0, 15).map((l) => ({
        id: l._id.toString(),
        count: l.count,
        date: l.date,
        note: l.note,
        tradeOutcome: l.tradeOutcome,
        createdAt: l.createdAt,
      })),
    };
  }

  /**
   * Recalculates streak after a new check-in
   */
  static updateStreak(
    participant: IParticipant,
    checkInDate: string
  ): { currentStreak: number; bestStreak: number } {
    const today = this.formatDate(new Date());
    const yesterday = this.formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    let current = participant.currentStreak;
    const lastDate = participant.lastCheckInDate;

    if (!lastDate) {
      current = 1;
    } else if (lastDate === checkInDate) {
      // Multiple check-ins on the same day don't advance the streak count
      current = participant.currentStreak || 1;
    } else if (lastDate === yesterday && checkInDate === today) {
      // Consecutive day!
      current += 1;
    } else {
      // Broken streak, reset to 1
      current = 1;
    }

    const best = Math.max(current, participant.bestStreak || 0);
    return { currentStreak: current, bestStreak: best };
  }
}
