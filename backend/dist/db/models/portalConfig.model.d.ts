import { Document, Model } from 'mongoose';
export interface IPortalConfig extends Document {
    openingDate: Date;
    closingDate: Date;
    manualStatus: 'AUTO' | 'COUNTDOWN' | 'OPEN' | 'CLOSED';
    resultPublicationDate?: Date;
    feeJunior: number;
    feeSenior: number;
    eventDate?: Date;
    eventTime?: string;
    venue?: string;
    venueMapUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PortalConfig: Model<IPortalConfig>;
//# sourceMappingURL=portalConfig.model.d.ts.map