import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILiveBriefing extends Document {
  chatId: number;
  messageId: number;
  date: string; // YYYY-MM-DD
  isPrivate: boolean;
  challengeIds: Types.ObjectId[];
  lastEditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LiveBriefingSchema = new Schema<ILiveBriefing>(
  {
    chatId: {
      type: Number,
      required: true,
      index: true,
    },
    messageId: {
      type: Number,
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    challengeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Challenge',
      },
    ],
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one active live briefing per chat per calendar date
LiveBriefingSchema.index({ chatId: 1, date: 1 }, { unique: true });

export const LiveBriefing = mongoose.model<ILiveBriefing>('LiveBriefing', LiveBriefingSchema);
