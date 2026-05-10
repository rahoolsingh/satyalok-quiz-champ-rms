import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── AdminUser ────────────────────────────────────────────────────────────────
export interface IAdminUser extends Document {
  username: string;
  passwordHash: string;
  email: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    email: { type: String, required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);

// ─── PortalConfiguration ──────────────────────────────────────────────────────
export interface IPortalConfig extends Document {
  openingDate: Date;
  closingDate: Date;
  manualStatus: 'AUTO' | 'COUNTDOWN' | 'OPEN' | 'CLOSED';
  resultPublicationDate?: Date;
  feeJunior: number;
  feeSenior: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortalConfigSchema = new Schema<IPortalConfig>(
  {
    openingDate: { type: Date, required: true },
    closingDate: { type: Date, required: true },
    manualStatus: {
      type: String,
      enum: ['AUTO', 'COUNTDOWN', 'OPEN', 'CLOSED'],
      default: 'AUTO',
    },
    resultPublicationDate: { type: Date },
    feeJunior: { type: Number, default: 100 },
    feeSenior: { type: Number, default: 150 },
  },
  { timestamps: true }
);

export const PortalConfig: Model<IPortalConfig> =
  mongoose.models.PortalConfig || mongoose.model<IPortalConfig>('PortalConfig', PortalConfigSchema);

// ─── SliderImage ──────────────────────────────────────────────────────────────
export interface ISliderImage extends Document {
  imageUrl: string;
  s3Key: string;
  displayOrder: number;
  createdAt: Date;
}

const SliderImageSchema = new Schema<ISliderImage>(
  {
    imageUrl: { type: String, required: true },
    s3Key: { type: String, required: true },
    displayOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const SliderImage: Model<ISliderImage> =
  mongoose.models.SliderImage || mongoose.model<ISliderImage>('SliderImage', SliderImageSchema);

// ─── Participant ──────────────────────────────────────────────────────────────
export interface IParticipant extends Document {
  rollNumber?: string;
  name: string;
  class: string;
  batchType: 'JUNIOR' | 'SENIOR';
  guardianName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  referralSource?: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  paymentId?: string;
  admitCardUrl?: string;
  merchantTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    rollNumber: { type: String },
    name: { type: String, required: true },
    class: { type: String, required: true },
    batchType: { type: String, enum: ['JUNIOR', 'SENIOR'], required: true },
    guardianName: { type: String, required: true },
    address: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String },
    referralSource: { type: String },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    paymentId: { type: String },
    admitCardUrl: { type: String },
    merchantTransactionId: { type: String },
  },
  { timestamps: true }
);

ParticipantSchema.index({ mobileNumber: 1 });
ParticipantSchema.index({ merchantTransactionId: 1 }, { unique: true, sparse: true });
ParticipantSchema.index({ batchType: 1 });
ParticipantSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });

export const Participant: Model<IParticipant> =
  mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema);

// ─── OTPVerification ──────────────────────────────────────────────────────────
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

// ─── Result ───────────────────────────────────────────────────────────────────
export interface IResult extends Document {
  participantId: mongoose.Types.ObjectId;
  rollNumber: string;
  score: number;
  rank?: number;
  remarks?: string;
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
    publishedAt: { type: Date },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const Result: Model<IResult> =
  mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
