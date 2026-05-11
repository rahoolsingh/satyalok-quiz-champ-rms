import { Router, Response } from 'express';
import { sessionAuthMiddleware, SessionRequest } from '../middleware/sessionAuth';
import { getProfile, checkDuplicateRegistration } from '../services/profile';
import { Participant } from '../db/models';
import { generateAdmitCardPDF } from '../services/admitCardPdf';

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

// GET /api/profile/admit-card/download
// Download admit card PDF for authenticated user
// Always generates PDF on-the-fly to ensure latest data
profileRouter.get(
  '/admit-card/download',
  sessionAuthMiddleware,
  async (req: SessionRequest, res: Response) => {
    try {
      const mobile = req.verifiedMobile!;

      // Find participant by mobile number
      const participant = await Participant.findOne({ mobileNumber: mobile })
        .sort({ createdAt: -1 })
        .lean();

      if (!participant) {
        return res.status(404).json({ error: 'No registration found' });
      }

      // Validate payment status
      if (participant.paymentStatus !== 'COMPLETED') {
        return res.status(403).json({
          error: 'Payment not completed. Complete payment to download admit card.',
        });
      }

      // Validate roll number assignment
      if (!participant.rollNumber) {
        return res.status(400).json({
          error: 'Roll number not yet assigned. Please contact support.',
        });
      }

      // Prepare admit card data
      const admitCardData = {
        rollNumber: participant.rollNumber,
        name: participant.name,
        class: participant.class,
        batchType: participant.batchType,
        guardianName: participant.guardianName,
        mobileNumber: participant.mobileNumber,
        photoUrl: participant.photoUrl,
        eventName: 'Quiz Champ 2026 Competition',
        eventDate: 'To be announced',
        venue: 'To be announced',
      };

      // Generate PDF
      const pdfBuffer = await generateAdmitCardPDF(admitCardData);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="admit-card-${participant.rollNumber}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF buffer
      return res.send(pdfBuffer);
    } catch (error) {
      console.error('[profile/admit-card/download] Error:', error);
      return res.status(500).json({
        error: 'Failed to generate admit card. Please try again later.',
      });
    }
  }
);
