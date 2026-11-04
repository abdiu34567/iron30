import { Types } from 'mongoose';
import { Challenge, IChallenge } from '../models/Challenge';
import { Participant, IParticipant } from '../models/Participant';
import { CheckInLog, ICheckInLog } from '../models/CheckInLog';
import { User } from '../models/User';
import { ProgressService } from './progressService';

export interface CreateChallengeInput {
  title: string;
  description: string;
  targetCount: number;
  unit?: string;
  dailyGoal?: number;
  durationDays?: number;
  startDate?: Date;
  creatorTelegramId: number;
  creatorName: string;
  creatorUsername?: string;
  creatorPhotoUrl?: string;
  telegramChatId?: number;
}

export interface JoinChallengeInput {
  challengeId: string;
  userId: number;
  userName: string;
  username?: string;
  photoUrl?: string;
}

export interface AddCheckInInput {
  challengeId: string;
  userId: number;
  userName?: string;
  username?: string;
  photoUrl?: string;
  count: number;
  note?: string;
  date?: string;
  tradeOutcome?: 'win' | 'loss' | 'breakeven';
}

export interface UpdateChallengeInput {
  userId: number;
  startDate?: Date;
  title?: string;
  description?: string;
  targetCount?: number;
  unit?: string;
  dailyGoal?: number;
  durationDays?: number;
}

export class ChallengeService {
  /**
   * Create a new challenge and auto-join the creator as participant
   */
  static async createChallenge(input: CreateChallengeInput): Promise<IChallenge> {
    const durationDays = input.durationDays || 30;
    const rawStart = input.startDate || new Date();
    const d = new Date(rawStart);
    const startDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + durationDays);

    const targetCount = input.targetCount;
    const dailyGoal = input.dailyGoal || Math.ceil(targetCount / durationDays);

    // Upsert creator in User collection
    await User.findOneAndUpdate(
      { telegramId: input.creatorTelegramId },
      {
        firstName: input.creatorName,
        username: input.creatorUsername,
        photoUrl: input.creatorPhotoUrl,
      },
      { upsert: true, new: true }
    );

    const challenge = await Challenge.create({
      title: input.title,
      description: input.description,
      targetCount,
      unit: input.unit || 'reps',
      dailyGoal,
      durationDays,
      startDate,
      endDate,
      creatorTelegramId: input.creatorTelegramId,
      telegramChatId: input.telegramChatId,
      status: 'active',
      participantCount: 1,
      totalCompletedCount: 0,
    });

    // Auto-join creator
    await Participant.create({
      challengeId: challenge._id,
      userId: input.creatorTelegramId,
      userName: input.creatorName,
      username: input.creatorUsername,
      photoUrl: input.creatorPhotoUrl,
      totalProgress: 0,
      currentStreak: 0,
      bestStreak: 0,
    });

    return challenge;
  }

  /**
   * List all active or recent challenges with real-time calculated participant & progress stats
   */
  static async getChallenges(status?: string, userId?: number): Promise<any[]> {
    const query = status ? { status } : {};
    const challenges = await Challenge.find(query).sort({ createdAt: -1 }).lean();

    const userJoinedSet = new Set<string>();
    if (userId) {
      const userParts = await Participant.find({ userId }, { challengeId: 1 }).lean();
      userParts.forEach((p) => userJoinedSet.add(p.challengeId.toString()));
    }

    return Promise.all(
      challenges.map(async (challenge) => {
        const participantCount = await Participant.countDocuments({
          challengeId: challenge._id,
        });

        const progressAgg = await Participant.aggregate([
          { $match: { challengeId: challenge._id } },
          { $group: { _id: null, total: { $sum: '$totalProgress' } } },
        ]);
        const totalCompletedCount = progressAgg[0]?.total || 0;

        // Keep database document in sync with true reality
        if (
          challenge.participantCount !== participantCount ||
          challenge.totalCompletedCount !== totalCompletedCount
        ) {
          Challenge.findByIdAndUpdate(challenge._id, {
            participantCount,
            totalCompletedCount,
          }).exec();
        }

        return {
          ...challenge,
          participantCount,
          totalCompletedCount,
          isJoined: userJoinedSet.has(challenge._id.toString()),
        };
      })
    );
  }

  /**
   * Get single challenge by ID with real-time calculated participant count
   */
  static async getChallengeById(id: string): Promise<any | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const challenge = await Challenge.findById(id).lean();
    if (!challenge) return null;

    const participantCount = await Participant.countDocuments({
      challengeId: challenge._id,
    });

    const progressAgg = await Participant.aggregate([
      { $match: { challengeId: challenge._id } },
      { $group: { _id: null, total: { $sum: '$totalProgress' } } },
    ]);
    const totalCompletedCount = progressAgg[0]?.total || 0;

    if (
      challenge.participantCount !== participantCount ||
      challenge.totalCompletedCount !== totalCompletedCount
    ) {
      Challenge.findByIdAndUpdate(challenge._id, {
        participantCount,
        totalCompletedCount,
      }).exec();
    }

    return {
      ...challenge,
      participantCount,
      totalCompletedCount,
    };
  }

  /**
   * Join an existing challenge
   */
  static async joinChallenge(input: JoinChallengeInput): Promise<IParticipant> {
    const challenge = await Challenge.findById(input.challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // Upsert user profile
    await User.findOneAndUpdate(
      { telegramId: input.userId },
      {
        firstName: input.userName,
        username: input.username,
        photoUrl: input.photoUrl,
      },
      { upsert: true }
    );

    // Find or create participant
    let participant = await Participant.findOne({
      challengeId: input.challengeId,
      userId: input.userId,
    });

    if (!participant) {
      participant = await Participant.create({
        challengeId: input.challengeId,
        userId: input.userId,
        userName: input.userName,
        username: input.username,
        photoUrl: input.photoUrl,
        totalProgress: 0,
        currentStreak: 0,
        bestStreak: 0,
        status: 'active',
      });
    }

    // Always recalculate real participantCount from database
    const realParticipantCount = await Participant.countDocuments({
      challengeId: input.challengeId,
    });
    await Challenge.findByIdAndUpdate(input.challengeId, {
      participantCount: realParticipantCount,
    });

    return participant;
  }

  /**
   * Record a check-in progress
   */
  static async addCheckIn(input: AddCheckInInput): Promise<{
    log: ICheckInLog;
    participant: IParticipant;
  }> {
    if (isNaN(input.count)) {
      throw new Error('Check-in count must be a valid number');
    }

    const cleanCount = Math.round(input.count * 100) / 100;

    let participant = await Participant.findOne({
      challengeId: input.challengeId,
      userId: input.userId,
    });

    if (!participant) {
      participant = await Participant.create({
        challengeId: input.challengeId,
        userId: input.userId,
        userName: input.userName || `User ${input.userId}`,
        username: input.username,
        photoUrl: input.photoUrl,
        totalProgress: 0,
        currentStreak: 0,
        bestStreak: 0,
        status: 'active',
      });
    }

    const todayStr = ProgressService.formatDate(new Date());
    const logDate = input.date || todayStr;

    // Create log record
    const log = await CheckInLog.create({
      challengeId: input.challengeId,
      participantId: participant._id,
      userId: input.userId,
      count: cleanCount,
      date: logDate,
      note: input.note,
      tradeOutcome: input.tradeOutcome,
    });

    // Calculate streaks
    if (logDate === todayStr) {
      const { currentStreak, bestStreak } = ProgressService.updateStreak(participant, todayStr);
      participant.currentStreak = currentStreak;
      participant.bestStreak = bestStreak;
      participant.lastCheckInDate = todayStr;
    }

    // Update participant
    participant.totalProgress = Math.round((participant.totalProgress + cleanCount) * 100) / 100;

    // Check if goal reached
    const challenge = await Challenge.findById(input.challengeId);
    if (challenge && participant.totalProgress >= challenge.targetCount) {
      participant.status = 'completed';
    }

    await participant.save();

    // Recalculate true overall tally and participant count
    const [realParticipantCount, progressAgg] = await Promise.all([
      Participant.countDocuments({ challengeId: input.challengeId }),
      Participant.aggregate([
        { $match: { challengeId: new Types.ObjectId(input.challengeId) } },
        { $group: { _id: null, total: { $sum: '$totalProgress' } } },
      ]),
    ]);
    const realTotal = progressAgg[0]?.total || 0;

    await Challenge.findByIdAndUpdate(input.challengeId, {
      participantCount: realParticipantCount,
      totalCompletedCount: realTotal,
    });

    return { log, participant };
  }

  /**
   * Get leaderboard of participants sorted by progress
   */
  static async getLeaderboard(challengeId: string): Promise<any[]> {
    const participants = await Participant.find({ challengeId })
      .sort({ totalProgress: -1, updatedAt: -1 })
      .lean();

    const challenge = await Challenge.findById(challengeId);
    const target = challenge ? challenge.targetCount : 1;

    return participants.map((p, idx) => ({
      rank: idx + 1,
      userId: p.userId,
      userName: p.userName,
      username: p.username,
      photoUrl: p.photoUrl,
      totalProgress: p.totalProgress,
      progressPercentage: Math.min(100, Math.round((p.totalProgress / target) * 100)),
      currentStreak: p.currentStreak,
      lastCheckInDate: p.lastCheckInDate,
      status: p.status,
    }));
  }

  /**
   * Update challenge properties such as startDate, title, description
   */
  static async updateChallenge(
    id: string,
    updates: UpdateChallengeInput
  ): Promise<IChallenge | null> {
    const challenge = await Challenge.findById(id);
    if (!challenge) return null;

    // Verify creator authorization: only the author can edit challenge settings
    if (challenge.creatorTelegramId !== 0 && challenge.creatorTelegramId !== updates.userId) {
      throw new Error('Only the challenge creator can edit challenge settings');
    }

    // If it was seeded as 0, claim it with current author
    if (challenge.creatorTelegramId === 0 && updates.userId) {
      challenge.creatorTelegramId = updates.userId;
    }

    if (updates.title) challenge.title = updates.title.trim();
    if (updates.description) challenge.description = updates.description.trim();
    if (updates.targetCount && updates.targetCount > 0) challenge.targetCount = updates.targetCount;
    if (updates.unit) challenge.unit = updates.unit.trim().toLowerCase();
    if (updates.durationDays && updates.durationDays > 0) challenge.durationDays = updates.durationDays;

    if (updates.dailyGoal && updates.dailyGoal > 0) {
      challenge.dailyGoal = updates.dailyGoal;
    } else if (updates.targetCount || updates.durationDays) {
      challenge.dailyGoal = Math.ceil(challenge.targetCount / (challenge.durationDays || 30));
    }

    if (updates.startDate || updates.durationDays) {
      // Normalize to UTC midnight of the intended calendar date
      const d = new Date(updates.startDate || challenge.startDate);
      const cleanStartDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
      challenge.startDate = cleanStartDate;
      const duration = challenge.durationDays || 30;
      const newEndDate = new Date(cleanStartDate);
      newEndDate.setUTCDate(cleanStartDate.getUTCDate() + duration);
      challenge.endDate = newEndDate;
    }

    await challenge.save();
    return challenge;
  }
}
