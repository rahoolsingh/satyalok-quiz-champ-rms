import { Participant, PortalConfig, Result } from '../db/models';
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
  questionPaperLanguage: 'HINDI' | 'ENGLISH';
  photoUrl?: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  rollNumber?: string;
  merchantTransactionId?: string;
  paymentAmount?: number;
  registeredAt: Date;
  admitCard?: ReturnType<typeof generateAdmitCardData>;
  result?: {
    score: number;
    positiveMarks?: number;
    negativeMarks?: number;
    rank?: number;
    remarks?: string;
  };
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
  let participant = await Participant.findOne({ mobileNumber, paymentStatus: 'COMPLETED' })
    .sort({ createdAt: -1 })
    .lean();

  if (!participant) {
    participant = await Participant.findOne({ mobileNumber })
      .sort({ createdAt: -1 })
      .lean();
  }

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
    questionPaperLanguage: participant.questionPaperLanguage as 'HINDI' | 'ENGLISH',
    photoUrl: participant.photoUrl,
    paymentStatus: participant.paymentStatus,
    rollNumber: participant.rollNumber,
    merchantTransactionId: participant.merchantTransactionId,
    registeredAt: participant.createdAt,
  };

  // Include admit card data if payment is completed AND roll number exists
  if (participant.paymentStatus === 'COMPLETED' && participant.rollNumber) {
    // Fetch event details from portal config
    const portalConfig = await PortalConfig.findOne().lean();
    
    const eventDate = portalConfig?.eventDate 
      ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : undefined;

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
    }, {
      eventDate,
      eventTime: portalConfig?.eventTime,
      reportingTime: portalConfig?.reportingTime,
      examTime: portalConfig?.examTime,
      venue: portalConfig?.venue,
      venueMapUrl: portalConfig?.venueMapUrl,
    });

    const isResultsPublished = portalConfig?.resultPublicationDate 
      ? new Date() >= new Date(portalConfig.resultPublicationDate)
      : false;

    if (isResultsPublished) {
      const resultDoc = await Result.findOne({ participantId: participant._id }).lean();
      if (resultDoc) {
        profile.result = {
          score: resultDoc.score,
          positiveMarks: resultDoc.positiveMarks,
          negativeMarks: resultDoc.negativeMarks,
          rank: resultDoc.rank,
          remarks: resultDoc.remarks,
        };
      }
    }
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
