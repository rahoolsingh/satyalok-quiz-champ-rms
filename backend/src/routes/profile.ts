import { Router, Response } from 'express';
import { sessionAuthMiddleware, SessionRequest } from '../middleware/sessionAuth';
import { getProfile, checkDuplicateRegistration } from '../services/profile';
import { Participant, PortalConfig } from '../db/models';
import { generateAdmitCardPDF } from '../services/admitCardPdf';
import { verifyPaymentStatus, processPaymentVerification } from '../services/paymentVerification';

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
      let participant = await Participant.findOne({ mobileNumber: mobile, paymentStatus: 'COMPLETED' })
        .sort({ createdAt: -1 })
        .lean();

      if (!participant) {
        participant = await Participant.findOne({ mobileNumber: mobile })
          .sort({ createdAt: -1 })
          .lean();
      }

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
      const portalConfig = await PortalConfig.findOne().lean();
      
      const eventDate = portalConfig?.eventDate 
        ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : undefined;
      
      const admitCardData = {
        rollNumber: participant.rollNumber,
        name: participant.name,
        class: participant.class,
        batchType: participant.batchType,
        guardianName: participant.guardianName,
        mobileNumber: participant.mobileNumber,
        photoUrl: participant.photoUrl,
        eventName: 'Quiz Champ 2026 Competition',
        eventDate,
        eventTime: portalConfig?.eventTime,
        reportingTime: portalConfig?.reportingTime,
        examTime: portalConfig?.examTime,
        venue: portalConfig?.venue,
        venueMapUrl: portalConfig?.venueMapUrl,
        participantId: participant._id.toString(),
      };

      // Generate PDF
      const pdfBuffer = await generateAdmitCardPDF(admitCardData);

      // Track admit card download
      await Participant.findByIdAndUpdate(participant._id, { admitCardDownloaded: true });

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

// POST /api/profile/check-pending-payments
// Check and update pending payment status for the authenticated user
profileRouter.post(
  '/check-pending-payments',
  sessionAuthMiddleware,
  async (req: SessionRequest, res: Response) => {
    try {
      const mobile = req.verifiedMobile!;

      // Find last 3 pending payments for this mobile number
      const pendingParticipants = await Participant.find({
        mobileNumber: mobile,
        paymentStatus: 'PENDING',
        merchantTransactionId: { $exists: true, $ne: null },
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      if (pendingParticipants.length === 0) {
        return res.json({
          message: 'No pending payments found',
          checkedCount: 0,
          updatedCount: 0,
        });
      }

      console.log(`[profile/check-pending-payments] Checking ${pendingParticipants.length} pending payments for ${mobile}`);

      let updatedCount = 0;

      // Check each pending payment with the gateway
      for (const participant of pendingParticipants) {
        try {
          const paymentStatus = await verifyPaymentStatus(participant.merchantTransactionId!);

          if (paymentStatus.status === 'SUCCESS') {
            console.log(`[profile/check-pending-payments] Found successful payment: ${participant.merchantTransactionId}`);
            
            // Process the payment verification
            await processPaymentVerification(participant.merchantTransactionId!);
            updatedCount++;
          } else if (paymentStatus.status === 'FAILED') {
            console.log(`[profile/check-pending-payments] Found failed payment: ${participant.merchantTransactionId}`);
            
            // Update to FAILED status
            await Participant.findByIdAndUpdate(participant._id, {
              paymentStatus: 'FAILED',
              updatedAt: new Date(),
            });
            updatedCount++;
          }
        } catch (error) {
          console.error(`[profile/check-pending-payments] Error checking ${participant.merchantTransactionId}:`, error);
          // Continue checking other payments
        }
      }

      // Get updated profile
      const profile = await getProfile(mobile);

      return res.json({
        message: `Checked ${pendingParticipants.length} pending payment(s), updated ${updatedCount}`,
        checkedCount: pendingParticipants.length,
        updatedCount,
        profile,
      });
    } catch (error) {
      console.error('[profile/check-pending-payments] Error:', error);
      return res.status(500).json({
        error: 'Failed to check pending payments. Please try again later.',
      });
    }
  }
);



