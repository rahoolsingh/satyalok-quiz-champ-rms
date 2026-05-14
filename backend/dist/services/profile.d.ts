import { generateAdmitCardData } from './admitCard';
export interface ProfileData {
    participantId: string;
    name: string;
    class: string;
    batchType: string;
    guardianName: string;
    address: string;
    mobileNumber: string;
    email?: string;
    referralSource?: string;
    photoUrl?: string;
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
    rollNumber?: string;
    merchantTransactionId?: string;
    paymentAmount?: number;
    registeredAt: Date;
    admitCard?: ReturnType<typeof generateAdmitCardData>;
}
export interface DuplicateCheckResult {
    exists: boolean;
    status?: 'COMPLETED' | 'PENDING' | 'FAILED';
    participantId?: string;
}
/**
 * Get complete profile data for a user by mobile number
 */
export declare function getProfile(mobileNumber: string): Promise<ProfileData | null>;
/**
 * Check if a mobile number already has a registration
 */
export declare function checkDuplicateRegistration(mobileNumber: string): Promise<DuplicateCheckResult>;
//# sourceMappingURL=profile.d.ts.map