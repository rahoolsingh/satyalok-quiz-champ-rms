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

    // Allow login for all users (removed restriction for completed registrations)
    // Users can login anytime to view their admit card

    const otp = await createOTP(mobile);
    await sendOTP(mobile, otp);

    return res.json({
      message: 'OTP sent successfully via WhatsApp',
      maskedMobile: maskMobile(mobile),
      deliveryMethod: 'whatsapp',
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

    // Set secure HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Update otpVerifiedAt on any existing participant record
    await Participant.findOneAndUpdate(
      { mobileNumber: mobile },
      { otpVerifiedAt: new Date() },
      { sort: { createdAt: -1 } }
    );

    // Check for any existing registration (completed, pending, or failed)
    const participant = await Participant.findOne({ mobileNumber: mobile })
      .sort({ createdAt: -1 })
      .lean();

    if (!participant) {
      // New user - no profile data
      return res.json({
        message: 'OTP verified successfully',
        profile: null,
      });
    }

    // Return complete profile data
    const profile = {
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
      merchantTransactionId: participant.merchantTransactionId,
      rollNumber: participant.rollNumber,
      registeredAt: participant.createdAt,
    };

    return res.json({
      message: 'OTP verified successfully',
      profile,
    });
  } catch (err) {
    console.error('[otp/verify]', err);
    return res.status(500).json({ error: 'OTP verification failed' });
  }
});

// POST /api/otp/logout
otpRouter.post('/logout', async (_req: Request, res: Response) => {
  try {
    // Clear the session cookie
    res.clearCookie('sessionToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });

    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('[otp/logout]', err);
    return res.status(500).json({ error: 'Logout failed' });
  }
});
