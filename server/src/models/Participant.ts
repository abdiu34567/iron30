import mongoose, { Document, Schema, Types } from 'mongoose';

export type ParticipantStatus = 'active' | 'completed' | 'abandoned';

export interface IParticipant extends Document {
  challengeId: Types.ObjectId;
  userId: number; // Telegram ID
  userName: string;
  username?: string;
  photoUrl?: string;
  totalProgress: number;
  currentStreak: number;
  bestStreak: number;
  lastCheckInDate?: string; // YYYY-MM-DD
  status: ParticipantStatus;
  joinedAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    totalProgress: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastCheckInDate: {
      type: String, // YYYY-MM-DD
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate joins to the same challenge
ParticipantSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
// Index for fast leaderboard queries
ParticipantSchema.index({ challengeId: 1, totalProgress: -1 });

export const Participant = mongoose.model<IParticipant>('Participant', ParticipantSchema);
