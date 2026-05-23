import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParticipant extends Document {
  rollNumber?: string;
  name: string;
  class: string;
  batchType: 'JUNIOR' | 'SENIOR';
  gender?: 'MALE' | 'FEMALE';
  guardianName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  referralSource?: string;
  questionPaperLanguage?: 'HINDI' | 'ENGLISH';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentId?: string;
  admitCardUrl?: string;
  merchantTransactionId?: string;
  photoUrl?: string;
  otpVerifiedAt?: Date;
  thankYouMessageSent?: boolean;
  paymentReminderSent?: boolean;
  groupInviteSent?: boolean;
  groupJoined?: boolean;
  admitCardDownloaded?: boolean;
  lastAdmitCardReminderAt?: Date;
  lastImportantDatesSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    rollNumber: { type: String },
    name: { type: String, required: true },
    class: { type: String, required: true },
    batchType: { type: String, enum: ['JUNIOR', 'SENIOR'], required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE'] },
    guardianName: { type: String, required: true },
    address: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String },
    referralSource: { type: String },
    questionPaperLanguage: { type: String, enum: ['HINDI', 'ENGLISH'], required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    paymentId: { type: String },
    admitCardUrl: { type: String },
    merchantTransactionId: { type: String },
    photoUrl: { type: String },
    otpVerifiedAt: { type: Date },
    thankYouMessageSent: { type: Boolean, default: false },
    paymentReminderSent: { type: Boolean, default: false },
    groupInviteSent: { type: Boolean, default: false },
    groupJoined: { type: Boolean, default: false },
    admitCardDownloaded: { type: Boolean, default: false },
    lastAdmitCardReminderAt: { type: Date },
    lastImportantDatesSentAt: { type: Date },
  },
  { timestamps: true }
);

ParticipantSchema.index({ mobileNumber: 1 });
ParticipantSchema.index({ merchantTransactionId: 1 }, { unique: true, sparse: true });
ParticipantSchema.index({ batchType: 1 });
ParticipantSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });

export const Participant: Model<IParticipant> =
  mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema);
