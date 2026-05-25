import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const FAQ: Model<IFAQ> =
  mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema);
