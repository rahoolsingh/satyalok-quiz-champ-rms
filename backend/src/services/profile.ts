import { Participant } from '../db/models';
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
export async function getProfile(mobileNumber: string): Promise<ProfileData | null> {
  const participant = await Participant.findOne({ mobileNumber })
    .sort({ createdAt: -1 })
    .lean();

  if (!participant) {
    return null;
  }

  const profile: ProfileData = {
    participantId: participant._id.toString(),
    name: participant.name,
    class: participant.class,
    batchType: participant.batchType,
    guardianName: participant.guardianName,
    address: participant.address,
    mobileNumber: participant.mobileNumber,
    email: participant.email,
    referralSource: participant.referralSource,
    photoUrl: participant.photoUrl,
    paymentStatus: participant.paymentStatus,
    rollNumber: participant.rollNumber,
    merchantTransactionId: participant.merchantTransactionId,
    registeredAt: participant.createdAt,
  };

  // Include admit card data if payment is completed AND roll number exists
  if (participant.paymentStatus === 'COMPLETED' && participant.rollNumber) {
    profile.admitCard = generateAdmitCardData({
      id: participant._id.toString(),
      rollNumber: participant.rollNumber,
      name: participant.name,
      class: participant.class,
      batchType: participant.batchType,
      guardianName: participant.guardianName,
      address: participant.address,
      mobileNumber: participant.mobileNumber,
      paymentStatus: participant.paymentStatus,
      photoUrl: participant.photoUrl,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    });
  }

  return profile;
}

/**
 * Check if a mobile number already has a registration
 */
export async function checkDuplicateRegistration(
  mobileNumber: string
): Promise<DuplicateCheckResult> {
  const participant = await Participant.findOne({ mobileNumber })
    .sort({ createdAt: -1 })
    .lean();

  if (!participant) {
    return { exists: false };
  }

  return {
    exists: true,
    status: participant.paymentStatus,
    participantId: participant._id.toString(),
  };
}
