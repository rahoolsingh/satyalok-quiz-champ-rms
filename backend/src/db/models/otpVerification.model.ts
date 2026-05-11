import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTPVerification extends Document {
  mobileNumber: string;
  otpHash: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

const OTPVerificationSchema = new Schema<IOTPVerification>(
  {
    mobileNumber: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const OTPVerification: Model<IOTPVerification> =
  mongoose.models.OTPVerification ||
  mongoose.model<IOTPVerification>('OTPVerification', OTPVerificationSchema);
