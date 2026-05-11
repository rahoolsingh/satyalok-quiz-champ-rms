import mongoose, { Schema, Document, Model } from 'mongoose';

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
