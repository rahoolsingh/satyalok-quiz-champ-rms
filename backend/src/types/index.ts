export type BatchType = 'JUNIOR' | 'SENIOR';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type Gender = 'MALE' | 'FEMALE';
export type ManualStatus = 'AUTO' | 'COUNTDOWN' | 'OPEN' | 'CLOSED';
export type PortalState = 'COUNTDOWN' | 'OPEN' | 'CLOSED';

export interface Participant {
  id: string;
  rollNumber: string | null;
  name: string;
  class: string;
  batchType: BatchType;
  gender?: Gender;
  guardianName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  referralSource?: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  admitCardUrl?: string;
  merchantTransactionId?: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OTPVerification {
  id: string;
  mobileNumber: string;
  otpHash: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

export interface PortalConfiguration {
  id: string;
  openingDate: Date;
  closingDate: Date;
  manualStatus: ManualStatus;
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

export interface SliderImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
  createdAt: Date;
}

export interface Result {
  id: string;
  participantId: string;
  rollNumber: string;
  score: number;
  rank?: number;
  remarks?: string;
  publishedAt?: Date;
  createdAt: Date;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface RegistrationInput {
  name: string;
  class: string;
  batchType: BatchType;
  gender?: Gender;
  guardianName: string;
  address: string;
  mobileNumber: string;
  email?: string;
  referralSource?: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string>;
}
