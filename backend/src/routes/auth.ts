import { Router, Response } from 'express';
import { sessionAuthMiddleware, SessionRequest } from '../middleware/sessionAuth';
import { getProfile } from '../services/profile';

export const authRouter = Router();

// GET /api/auth/me
// Lightweight endpoint to check session validity and return basic auth state.
// Always returns 200 when token is valid (even if no registration exists).
// Returns 401 when token is missing/invalid.
authRouter.get('/me', sessionAuthMiddleware, async (req: SessionRequest, res: Response) => {
  try {
    const mobile = req.verifiedMobile!;
    const profile = await getProfile(mobile);

    return res.json({
      authenticated: true,
      mobile,
      hasProfile: profile !== null,
      profile: profile ?? null,
      paymentStatus: profile?.paymentStatus ?? null,
      step: !profile
        ? 'register'
        : profile.paymentStatus === 'COMPLETED'
          ? 'profile'
          : 'register',
    });
  } catch (err) {
    console.error('[auth/me]', err);
    return res.status(500).json({ error: 'Failed to check auth status' });
  }
});
