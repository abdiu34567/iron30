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
  };
  heatmap: DayHeatmapItem[];
  recentLogs: Array<{
    id: string;
    count: number;
    date: string;
    note?: string;
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

    // Aggregate daily counts: Map<YYYY-MM-DD, totalForDay>
    const dailyMap = new Map<string, number>();
    for (const log of logs) {
      const prev = dailyMap.get(log.date) || 0;
      dailyMap.set(log.date, prev + log.count);
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

      heatmap.push({
        dayNumber: dayIndex + 1,
        date: dateStr,
        targetCount: dailyGoal,
        loggedCount: logged,
        status,
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
      },
      heatmap,
      recentLogs: logs.slice(0, 15).map((l) => ({
        id: l._id.toString(),
        count: l.count,
        date: l.date,
        note: l.note,
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
