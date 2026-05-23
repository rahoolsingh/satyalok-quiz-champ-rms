import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentAttempt extends Document {
  participantId: string;
  mobileNumber: string;
  merchantTransactionId: string;
  amount: number;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'PENDING';
  gatewayResponse?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentAttemptSchema = new Schema<IPaymentAttempt>(
  {
    participantId: { type: String, required: true, index: true },
    mobileNumber: { type: String, required: true, index: true },
    merchantTransactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['INITIATED', 'SUCCESS', 'FAILED', 'PENDING'],
      default: 'INITIATED',
    },
    gatewayResponse: { type: String },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentAttemptSchema.index({ status: 1, createdAt: -1 });

export const PaymentAttempt: Model<IPaymentAttempt> =
  mongoose.models.PaymentAttempt || mongoose.model<IPaymentAttempt>('PaymentAttempt', PaymentAttemptSchema);
