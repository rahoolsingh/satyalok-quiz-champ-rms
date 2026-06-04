import mongoose, { Schema, Document, Model } from 'mongoose';

export type AttendanceLogAction =
  | 'SCAN_SUCCESS'
  | 'SCAN_DUPLICATE'
  | 'SCAN_ERROR'
  | 'MANUAL_ENTRY'
  | 'MANUAL_DUPLICATE';

export interface IAttendanceLog extends Document {
  participantId?: mongoose.Types.ObjectId;
  rollNumber?: string;
  action: AttendanceLogAction;
  timestamp: Date;
  scannedBy: mongoose.Types.ObjectId;
  qrData?: string;
  errorMessage?: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
}

const AttendanceLogSchema = new Schema<IAttendanceLog>(
  {
    participantId: { type: Schema.Types.ObjectId, ref: 'Participant' },
    rollNumber: { type: String },
    action: {
      type: String,
      enum: ['SCAN_SUCCESS', 'SCAN_DUPLICATE', 'SCAN_ERROR', 'MANUAL_ENTRY', 'MANUAL_DUPLICATE'],
      required: true,
    },
    timestamp: { type: Date, required: true, default: Date.now },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    qrData: { type: String },
    errorMessage: { type: String },
    deviceInfo: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

AttendanceLogSchema.index({ timestamp: -1 });
AttendanceLogSchema.index({ participantId: 1, timestamp: -1 });
AttendanceLogSchema.index({ action: 1, timestamp: -1 });
AttendanceLogSchema.index({ scannedBy: 1, timestamp: -1 });

export const AttendanceLog: Model<IAttendanceLog> =
  mongoose.models.AttendanceLog ||
  mongoose.model<IAttendanceLog>('AttendanceLog', AttendanceLogSchema);
