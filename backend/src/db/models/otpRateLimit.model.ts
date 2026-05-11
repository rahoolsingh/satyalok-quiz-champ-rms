import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOtpRateLimit extends Document {
  mobileNumber: string;
  requestCount: number;
  windowStart: Date;
  lastRequestAt: Date;
  blockedUntil?: Date;
  createdAt: Date;
}

const OtpRateLimitSchema = new Schema<IOtpRateLimit>(
  {
    mobileNumber: { type: String, required: true, unique: true, index: true },
    requestCount: { type: Number, default: 0 },
    windowStart: { type: Date, required: true },
    lastRequestAt: { type: Date, required: true },
    blockedUntil: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const OtpRateLimit: Model<IOtpRateLimit> =
  mongoose.models.OtpRateLimit || mongoose.model<IOtpRateLimit>('OtpRateLimit', OtpRateLimitSchema);
