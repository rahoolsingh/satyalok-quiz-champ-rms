import { Document, Model } from 'mongoose';
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
    photoUrl?: string;
    otpVerifiedAt?: Date;
    thankYouMessageSent?: boolean;
    paymentReminderSent?: boolean;
    groupInviteSent?: boolean;
    admitCardDownloaded?: boolean;
    lastAdmitCardReminderAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Participant: Model<IParticipant>;
//# sourceMappingURL=participant.model.d.ts.map