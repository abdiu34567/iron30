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
  count: number;
  note?: string;
}

export class ChallengeService {
  /**
   * Create a new challenge and auto-join the creator as participant
   */
  static async createChallenge(input: CreateChallengeInput): Promise<IChallenge> {
    const durationDays = input.durationDays || 30;
    const startDate = input.startDate || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);

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
   * List all active or recent challenges
   */
  static async getChallenges(status?: string): Promise<IChallenge[]> {
    const query = status ? { status } : {};
    return Challenge.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get single challenge by ID
   */
  static async getChallengeById(id: string): Promise<IChallenge | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Challenge.findById(id);
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

      // Increment participant count
      await Challenge.findByIdAndUpdate(input.challengeId, {
        $inc: { participantCount: 1 },
      });
    }

    return participant;
  }

  /**
   * Record a check-in progress
   */
  static async addCheckIn(input: AddCheckInInput): Promise<{
    log: ICheckInLog;
    participant: IParticipant;
  }> {
    if (input.count <= 0) {
      throw new Error('Check-in count must be greater than zero');
    }

    const participant = await Participant.findOne({
      challengeId: input.challengeId,
      userId: input.userId,
    });

    if (!participant) {
      throw new Error('User is not a participant in this challenge');
    }

    const todayStr = ProgressService.formatDate(new Date());

    // Create log record
    const log = await CheckInLog.create({
      challengeId: input.challengeId,
      participantId: participant._id,
      userId: input.userId,
      count: input.count,
      date: todayStr,
      note: input.note,
    });

    // Calculate streaks
    const { currentStreak, bestStreak } = ProgressService.updateStreak(participant, todayStr);

    // Update participant
    participant.totalProgress += input.count;
    participant.currentStreak = currentStreak;
    participant.bestStreak = bestStreak;
    participant.lastCheckInDate = todayStr;

    // Check if goal reached
    const challenge = await Challenge.findById(input.challengeId);
    if (challenge && participant.totalProgress >= challenge.targetCount) {
      participant.status = 'completed';
    }

    await participant.save();

    // Increment challenge overall tally
    await Challenge.findByIdAndUpdate(input.challengeId, {
      $inc: { totalCompletedCount: input.count },
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
}
