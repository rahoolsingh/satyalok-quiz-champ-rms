import bcrypt from 'bcryptjs';
import https from 'https';
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
 * Sends OTP via 2Factor API (https://2factor.in).
 * Falls back to console log in mock mode.
 */
export async function sendOTP(mobileNumber: string, otp: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK SMS] OTP ${otp} → ${mobileNumber}`);
    return;
  }

  if (provider === '2factor') {
    const apiKey = process.env.TWOFACTOR_API_KEY;
    if (!apiKey) throw new Error('TWOFACTOR_API_KEY is not set');

    // 2Factor transactional SMS — send a custom OTP (no AUTOGEN suffix)
    // GET https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${mobileNumber}/${otp}`;

    await new Promise<void>((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.Status === 'Success') {
                resolve();
              } else {
                reject(new Error(`2Factor error: ${parsed.Details || data}`));
              }
            } catch {
              reject(new Error(`2Factor unexpected response: ${data}`));
            }
          });
        })
        .on('error', reject);
    });

    return;
  }

  throw new Error(`SMS provider "${provider}" is not supported`);
}
