import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPortalConfig extends Document {
  openingDate: Date;
  closingDate: Date;
  manualStatus: 'AUTO' | 'COUNTDOWN' | 'OPEN' | 'CLOSED';
  resultPublicationDate?: Date;
  feeJunior: number;
  feeSenior: number;
  eventDate?: Date;
  eventTime?: string;
  reportingTime?: string;
  examTime?: string;
  venue?: string;
  venueMapUrl?: string;
  prizeDistributionDate?: Date;
  prizeDistributionTime?: string;
  prizeDistributionVenue?: string;
  prizeDistributionMapUrl?: string;
  whatsappSupportName?: string;
  whatsappSupportNumber?: string;
  callContactName?: string;
  callContactNumber?: string;
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
    eventDate: { type: Date },
    eventTime: { type: String },
    reportingTime: { type: String },
    examTime: { type: String },
    venue: { type: String },
    venueMapUrl: { type: String },
    prizeDistributionDate: { type: Date },
    prizeDistributionTime: { type: String },
    prizeDistributionVenue: { type: String },
    prizeDistributionMapUrl: { type: String },
    whatsappSupportName: { type: String },
    whatsappSupportNumber: { type: String },
    callContactName: { type: String },
    callContactNumber: { type: String },
  },
  { timestamps: true }
);

export const PortalConfig: Model<IPortalConfig> =
  mongoose.models.PortalConfig || mongoose.model<IPortalConfig>('PortalConfig', PortalConfigSchema);
