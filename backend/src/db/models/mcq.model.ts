import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMcq extends Document {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  class?: string;
  batchType?: 'JUNIOR' | 'SENIOR' | 'BOTH';
  subject?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const McqSchema = new Schema<IMcq>(
  {
    question: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    class: { type: String },
    batchType: { type: String, enum: ['JUNIOR', 'SENIOR', 'BOTH'] },
    subject: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Mcq: Model<IMcq> =
  mongoose.models.Mcq || mongoose.model<IMcq>('Mcq', McqSchema);
