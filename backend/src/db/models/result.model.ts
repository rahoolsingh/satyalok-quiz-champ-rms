import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResult extends Document {
  participantId: mongoose.Types.ObjectId;
  rollNumber: string;
  score: number;
  rank?: number;
  remarks?: string;
  answerSheetUrl?: string;
  publishedAt?: Date;
  createdAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true, unique: true },
    rollNumber: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    rank: { type: Number },
    remarks: { type: String },
    answerSheetUrl: { type: String },
    publishedAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const Result: Model<IResult> =
  mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
