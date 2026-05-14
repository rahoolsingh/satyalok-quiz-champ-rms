import { Document, Model } from 'mongoose';
export interface IOTPVerification extends Document {
    mobileNumber: string;
    otpHash: string;
    expiresAt: Date;
    verified: boolean;
    attempts: number;
    createdAt: Date;
}
export declare const OTPVerification: Model<IOTPVerification>;
//# sourceMappingURL=otpVerification.model.d.ts.map