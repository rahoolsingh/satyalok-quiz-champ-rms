import { Router, Request, Response } from 'express';
import { createOTP, verifyOTP, sendOTP } from '../services/otp';
import { signSessionToken } from '../services/sessionToken';
import { Participant } from '../db/models';
import { ipOtpLimiter, mobileOtpLimiter } from '../middleware/otpRateLimit';

export const otpRouter = Router();

/**
 * Masks a 10-digit mobile number: shows first 2 and last 2 digits.
 * e.g. 9876543210 → 98******10
 */
export function maskMobile(mobile: string): string {
  return mobile.replace(/^(\d{2})\d{6}(\d{2})$/, '$1******$2');
}

// POST /api/otp/send
otpRouter.post('/send', ipOtpLimiter, mobileOtpLimiter, async (req: Request, res: Response) => {
  try {
    const { mobileNumber } = req.body;
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required' });
    }

    const mobile = mobileNumber.trim();

    // Block if already completed
    const completed = await Participant.findOne({ mobileNumber: mobile, paymentStatus: 'COMPLETED' });
    if (completed) {
      return res.status(409).json({
        error: 'This mobile number is already registered. Use the tracking page to view your admit card.',
        alreadyRegistered: true,
      });
    }

    const otp = await createOTP(mobile);
    await sendOTP(mobile, otp);

    return res.json({
      message: 'OTP sent successfully',
      maskedMobile: maskMobile(mobile),
    });
  } catch (err) {
    console.error('[otp/send]', err);
    return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/otp/verify
otpRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    const mobile = mobileNumber.trim();

    const result = await verifyOTP(mobile, otp);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Issue session token
    const sessionToken = signSessionToken(mobile);

    // Update otpVerifiedAt on any existing participant record
    await Participant.findOneAndUpdate(
      { mobileNumber: mobile },
      { otpVerifiedAt: new Date() },
      { sort: { createdAt: -1 } }
    );

    // Return existing draft if present
    const draft = await Participant.findOne({
      mobileNumber: mobile,
      paymentStatus: { $in: ['PENDING', 'FAILED'] },
    }).sort({ createdAt: -1 }).lean();

    return res.json({
      message: 'OTP verified successfully',
      sessionToken,
      draft: draft
        ? {
            participantId: draft._id.toString(),
            name: draft.name,
            class: draft.class,
            batchType: draft.batchType,
            guardianName: draft.guardianName,
            address: draft.address,
            mobileNumber: draft.mobileNumber,
            email: draft.email,
            referralSource: draft.referralSource,
            photoUrl: draft.photoUrl,
            paymentStatus: draft.paymentStatus,
            merchantTransactionId: draft.merchantTransactionId,
          }
        : null,
    });
  } catch (err) {
    console.error('[otp/verify]', err);
    return res.status(500).json({ error: 'OTP verification failed' });
  }
});
