import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICheckInLog extends Document {
  challengeId: Types.ObjectId;
  participantId: Types.ObjectId;
  userId: number; // Telegram ID
  count: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CheckInLogSchema = new Schema<ICheckInLog>(
  {
    challengeId: {
      type: Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    participantId: {
      type: Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
      index: true,
    },
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    count: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 280,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookups for participant daily logs and calendar heatmaps
CheckInLogSchema.index({ challengeId: 1, userId: 1, date: 1 });

export const CheckInLog = mongoose.model<ICheckInLog>('CheckInLog', CheckInLogSchema);
