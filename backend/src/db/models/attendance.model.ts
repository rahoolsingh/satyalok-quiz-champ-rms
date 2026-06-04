import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  participantId: mongoose.Types.ObjectId;
  rollNumber: string;
  name: string;
  batchType: 'JUNIOR' | 'SENIOR';
  class: string;
  mobileNumber: string;
  photoUrl?: string;
  checkInTime: Date;
  checkInDate: string; // YYYY-MM-DD, used for duplicate check
  scannedBy: mongoose.Types.ObjectId;
  scanMethod: 'QR' | 'MANUAL';
  qrData?: string;
  deviceInfo?: string;
  duplicateAttempts: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true },
    rollNumber: { type: String, required: true },
    name: { type: String, required: true },
    batchType: { type: String, enum: ['JUNIOR', 'SENIOR'], required: true },
    class: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    photoUrl: { type: String },
    checkInTime: { type: Date, required: true },
    checkInDate: { type: String, required: true }, // YYYY-MM-DD in IST
    scannedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    scanMethod: { type: String, enum: ['QR', 'MANUAL'], required: true },
    qrData: { type: String },
    deviceInfo: { type: String },
    duplicateAttempts: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

// Unique constraint: one attendance per participant per day
AttendanceSchema.index({ participantId: 1, checkInDate: 1 }, { unique: true });
AttendanceSchema.index({ checkInTime: -1 });
AttendanceSchema.index({ batchType: 1, checkInDate: 1 });
AttendanceSchema.index({ rollNumber: 1 });
AttendanceSchema.index({ checkInDate: 1 });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
