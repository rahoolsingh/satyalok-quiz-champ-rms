import { Document, Model } from 'mongoose';
export interface IOtpRateLimit extends Document {
    mobileNumber: string;
    requestCount: number;
    windowStart: Date;
    lastRequestAt: Date;
    blockedUntil?: Date;
    createdAt: Date;
}
export declare const OtpRateLimit: Model<IOtpRateLimit>;
//# sourceMappingURL=otpRateLimit.model.d.ts.map