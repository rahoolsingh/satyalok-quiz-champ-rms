import bcrypt from 'bcryptjs';
import axios from 'axios';
import { OTPVerification } from '../db/models';

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createOTP(mobileNumber: string): Promise<string> {
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate previous OTPs for this number
  await OTPVerification.updateMany(
    { mobileNumber, verified: false },
    { $set: { verified: true } }
  );

  await OTPVerification.create({ mobileNumber, otpHash, expiresAt });
  return otp;
}

export async function verifyOTP(
  mobileNumber: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const record = await OTPVerification.findOne({ mobileNumber, verified: false }).sort({
    createdAt: -1,
  });

  if (!record) {
    return { success: false, error: 'No active OTP found. Please request a new OTP.' };
  }

  if (new Date() > record.expiresAt) {
    return { success: false, error: 'OTP has expired. Please request a new OTP.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
  }

  record.attempts += 1;
  await record.save();

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) {
    return { success: false, error: 'Invalid OTP. Please try again.' };
  }

  record.verified = true;
  await record.save();

  return { success: true };
}

/**
 * Sends OTP via SMS API (axios, x-api-key auth).
 * Set SMS_PROVIDER=mock to skip the real call during development.
 */
export async function sendOTP(mobileNumber: string, otp: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK SMS] OTP ${otp} → ${mobileNumber}`);
    return;
  }

  const smsApiUrl = process.env.SMS_API_URL;
  const smsApiKey = process.env.SMS_API_KEY;
  if (!smsApiUrl) throw new Error('SMS_API_URL is not set');
  if (!smsApiKey) throw new Error('SMS_API_KEY is not set');

  const message = otpTemplate(otp);

  console.log('Sending OTP to', mobileNumber);

  const response = await axios.post(
    smsApiUrl,
    { mobileNumber, message },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': smsApiKey,
      },
    }
  );

  console.log('SMS response:', response.data);
}

// ─── SMS template ─────────────────────────────────────────────────────────────

function otpTemplate(otp: string): string {
  return `Your Quiz Champ 2026 OTP is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`;
}
