export type BatchType = 'JUNIOR' | 'SENIOR';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type Gender = 'MALE' | 'FEMALE';
export type PortalState = 'COUNTDOWN' | 'OPEN' | 'CLOSED';

export interface PortalStatus {
  state: PortalState;
  openingDate: string;
  closingDate: string;
  resultsPublished: boolean;
  resultPublicationDate?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  prizeDistributionDate?: string;
  prizeDistributionVenue?: string;
  prizeDistributionMapUrl?: string;
  whatsappSupportName?: string;
  whatsappSupportNumber?: string;
  callContactName?: string;
  callContactNumber?: string;
}

export interface SliderImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface RegistrationInput {
  name: string;
  class: string;
  batchType: BatchType;
  gender: Gender;
  guardianName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  referralSource?: string;
}

export interface AdmitCardData {
  rollNumber: string;
  name: string;
  class: string;
  batchType: string;
  guardianName: string;
  mobileNumber: string;
  eventName: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  venueMapUrl?: string;
  generatedAt: string;
  photoUrl?: string;
}

export interface ResultData {
  rollNumber: string;
  name: string;
  class: string;
  batchType: string;
  score: number;
  rank?: number;
  remarks?: string;
  publishedAt?: string;
}

export interface PaymentSession {
  sessionId?: string;
  redirectUrl: string;
  merchantTransactionId: string;
  amount: number;
  currency: string;
  participantId: string;
  provider: string;
  providerOrderId?: string;
}

export interface ProfileData {
  participantId: string;
  name: string;
  class: string;
  batchType: BatchType;
  gender?: Gender;
  guardianName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  referralSource?: string;
  photoUrl?: string;
  paymentStatus: PaymentStatus;
  rollNumber?: string;
  merchantTransactionId?: string;
  paymentAmount?: number;
  registeredAt: string;
  admitCard?: AdmitCardData;
}
