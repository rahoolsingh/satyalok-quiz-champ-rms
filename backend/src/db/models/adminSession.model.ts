import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminSession extends Document {
  adminId: string;
  token: string;
  deviceInfo: string;
  ipAddress: string;
  lastActiveAt: Date;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

const AdminSessionSchema = new Schema<IAdminSession>(
  {
    adminId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    deviceInfo: { type: String, default: 'Unknown Device' },
    ipAddress: { type: String, default: '' },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminSession: Model<IAdminSession> =
  mongoose.models.AdminSession || mongoose.model<IAdminSession>('AdminSession', AdminSessionSchema);
