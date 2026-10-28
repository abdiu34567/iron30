import mongoose, { Document, Schema } from 'mongoose';

export type ChallengeStatus = 'upcoming' | 'active' | 'completed';

export interface IChallenge extends Document {
  title: string;
  description: string;
  targetCount: number;
  unit: string;
  dailyGoal: number;
  durationDays: number;
  startDate: Date;
  endDate: Date;
  creatorTelegramId: number;
  telegramChatId?: number;
  status: ChallengeStatus;
  participantCount: number;
  totalCompletedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    targetCount: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
      default: 'reps',
      trim: true,
    },
    dailyGoal: {
      type: Number,
      required: true,
      min: 1,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    creatorTelegramId: {
      type: Number,
      required: true,
      index: true,
    },
    telegramChatId: {
      type: Number,
      index: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'active',
      index: true,
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    totalCompletedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);
