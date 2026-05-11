import { Router, Response } from 'express';
import { sessionAuthMiddleware, SessionRequest } from '../middleware/sessionAuth';
import { getProfile, checkDuplicateRegistration } from '../services/profile';

export const profileRouter = Router();

// GET /api/profile/me
// Returns profile for the currently authenticated user (from cookie)
profileRouter.get('/me', sessionAuthMiddleware, async (req: SessionRequest, res: Response) => {
  try {
    const mobile = req.verifiedMobile!;

    const profile = await getProfile(mobile);

    if (!profile) {
      return res.status(404).json({ error: 'No registration found' });
    }

    return res.json({ profile });
  } catch (err) {
    console.error('[profile/me GET]', err);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// GET /api/profile
// Returns complete profile data for the authenticated user
profileRouter.get('/', sessionAuthMiddleware, async (req: SessionRequest, res: Response) => {
  try {
    const mobile = req.verifiedMobile!;

    const profile = await getProfile(mobile);

    if (!profile) {
      return res.status(404).json({ error: 'No registration found for this mobile number' });
    }

    return res.json({ profile });
  } catch (err) {
    console.error('[profile GET]', err);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// GET /api/profile/check-duplicate
// Check if a mobile number already has a registration
profileRouter.get('/check-duplicate', async (req: SessionRequest, res: Response) => {
  try {
    const mobile = (req.query.mobile as string || '').trim();
    
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ error: 'A valid 10-digit mobile number is required' });
    }

    const result = await checkDuplicateRegistration(mobile);

    return res.json(result);
  } catch (err) {
    console.error('[profile/check-duplicate]', err);
    return res.status(500).json({ error: 'Failed to check for duplicate registration' });
  }
});
