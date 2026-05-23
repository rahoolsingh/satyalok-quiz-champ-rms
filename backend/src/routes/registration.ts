import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { validateRegistration } from '../services/validation';
import { getRegistrationFee, generateMerchantTransactionId } from '../services/payment';
import { initiatePhonePePayment } from '../services/pgsClient';
import { generateAdmitCardData, generateAdmitCardHtml } from '../services/admitCard';
import { uploadToS3 } from '../services/storage';
import { Participant, PortalConfig, PaymentAttempt } from '../db/models';
import { sessionAuthMiddleware, SessionRequest } from '../middleware/sessionAuth';
import { validateImageFormat } from '../services/validation';
import { generateAdmitCardPDF } from '../services/admitCardPdf';
import { sendEventLocation, sendImportantDates } from '../services/whatsapp';

export const registrationRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// ─── Helper: build draft response shape ──────────────────────────────────────
function draftShape(p: InstanceType<typeof Participant> | Record<string, unknown>) {
  return {
    participantId: (p as { _id: { toString(): string } })._id.toString(),
    name: (p as { name: string }).name,
    class: (p as { class: string }).class,
    batchType: (p as { batchType: string }).batchType,
    gender: (p as { gender?: string }).gender,
    guardianName: (p as { guardianName: string }).guardianName,
    address: (p as { address: string }).address,
    mobileNumber: (p as { mobileNumber: string }).mobileNumber,
    email: (p as { email?: string }).email,
    referralSource: (p as { referralSource?: string }).referralSource,
    photoUrl: (p as { photoUrl?: string }).photoUrl,
    paymentStatus: (p as { paymentStatus: string }).paymentStatus,
    merchantTransactionId: (p as { merchantTransactionId?: string }).merchantTransactionId,
    createdAt: (p as { createdAt: Date }).createdAt,
  };
}

// ─── POST /api/registration/draft ────────────────────────────────────────────
// Authenticated. Multipart. Upserts participant record. Accepts optional photo.
registrationRouter.post(
  '/draft',
  sessionAuthMiddleware,
  upload.single('photo'),
  async (req: SessionRequest, res: Response) => {
    try {
      const mobile = req.verifiedMobile!;

      // Validate mobile matches token
      const bodyMobile = (req.body.mobileNumber || '').trim();
      if (bodyMobile && bodyMobile !== mobile) {
        return res.status(401).json({ error: 'Unauthorized: mobile number does not match session' });
      }

      // Validate form fields
      const input = {
        name: req.body.name,
        class: req.body.class,
        batchType: req.body.batchType,
        gender: req.body.gender,
        guardianName: req.body.guardianName,
        address: req.body.address,
        mobileNumber: mobile,
        email: req.body.email,
        referralSource: req.body.referralSource,
      };

      const validation = validateRegistration(input);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      // Handle photo upload
      let photoUrl: string | undefined;
      if (req.file) {
        if (!validateImageFormat(req.file.mimetype)) {
          return res.status(400).json({ error: 'Accepted photo formats: JPEG, PNG, WebP' });
        }
        const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
        const key = `photos/${uuidv4()}.${ext}`;
        const result = await uploadToS3(key, req.file.buffer, req.file.mimetype);
        photoUrl = result.url;
      }

      // Check if already completed
      const completed = await Participant.findOne({ mobileNumber: mobile, paymentStatus: 'COMPLETED' });
      if (completed) {
        return res.status(403).json({ error: 'Cannot edit a completed registration' });
      }

      // Upsert draft
      const updateData: Record<string, unknown> = {
        name: input.name.trim(),
        class: input.class.trim(),
        batchType: input.batchType,
        gender: input.gender,
        guardianName: input.guardianName.trim(),
        address: input.address.trim(),
        email: input.email?.trim() || undefined,
        referralSource: input.referralSource?.trim() || undefined,
        paymentStatus: 'PENDING',
        otpVerifiedAt: new Date(),
      };
      if (photoUrl) updateData.photoUrl = photoUrl;

      const participant = await Participant.findOneAndUpdate(
        { mobileNumber: mobile, paymentStatus: { $in: ['PENDING', 'FAILED'] } },
        { $set: updateData },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return res.json({
        message: 'Draft saved',
        draft: draftShape(participant),
      });
    } catch (err) {
      console.error('[registration/draft POST]', err);
      return res.status(500).json({ error: 'Failed to save draft' });
    }
  }
);

// ─── GET /api/registration/draft ─────────────────────────────────────────────
// Authenticated. Returns current draft for the verified mobile.
registrationRouter.get('/draft', sessionAuthMiddleware, async (req: SessionRequest, res: Response) => {
  try {
    const mobile = req.verifiedMobile!;
    const participant = await Participant.findOne({
      mobileNumber: mobile,
      paymentStatus: { $in: ['PENDING', 'FAILED'] },
    }).sort({ createdAt: -1 });

    if (!participant) {
      return res.status(404).json({ error: 'No draft found for this mobile number' });
    }

    return res.json({ draft: draftShape(participant) });
  } catch (err) {
    console.error('[registration/draft GET]', err);
    return res.status(500).json({ error: 'Failed to retrieve draft' });
  }
});

// ─── POST /api/registration/initiate-payment ─────────────────────────────────
// Authenticated. Calls PGS and returns redirectUrl.
registrationRouter.post(
  '/initiate-payment',
  sessionAuthMiddleware,
  async (req: SessionRequest, res: Response) => {
    try {
      const mobile = req.verifiedMobile!;

      const participant = await Participant.findOne({
        mobileNumber: mobile,
        paymentStatus: { $in: ['PENDING', 'FAILED'] },
      }).sort({ createdAt: -1 });

      if (!participant) {
        return res.status(404).json({ error: 'No draft found. Please complete the registration form first.' });
      }

      const amount = await getRegistrationFee(participant.batchType);
      const merchantTransactionId = generateMerchantTransactionId();

      await Participant.findByIdAndUpdate(participant._id, { merchantTransactionId });

      // Log payment attempt
      await PaymentAttempt.create({
        participantId: participant._id.toString(),
        mobileNumber: participant.mobileNumber,
        merchantTransactionId,
        amount,
        status: 'INITIATED',
      });

      let pgsResponse;
      try {
        pgsResponse = await initiatePhonePePayment({
          name: participant.name,
          mobileNumber: participant.mobileNumber,
          group: participant.batchType,
          amount,
          merchantTransactionId,
          email: participant.email,
          class: participant.class,
        });
      } catch (pgsErr: unknown) {
        console.error('PGS initiation failed:', pgsErr);
        return res.status(502).json({ error: 'Payment gateway unavailable. Please try again.' });
      }

      return res.json({
        redirectUrl: pgsResponse.redirectUrl,
        merchantTransactionId,
        amount,
        currency: 'INR',
        participantId: participant._id.toString(),
        provider: 'phonepe',
      });
    } catch (err) {
      console.error('[registration/initiate-payment]', err);
      return res.status(500).json({ error: 'Failed to initiate payment' });
    }
  }
);

// ─── GET /api/registration/track ─────────────────────────────────────────────
// Public. Returns registration status by mobile number.
registrationRouter.get('/track', async (req: SessionRequest, res: Response) => {
  try {
    const mobile = (req.query.mobile as string || '').trim();
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ error: 'A valid 10-digit mobile number is required' });
    }

    const participant = await Participant.findOne({ mobileNumber: mobile }).sort({ createdAt: -1 });
    if (!participant) {
      return res.status(404).json({ error: 'No registration found for this mobile number' });
    }

    const base = {
      participantId: participant._id.toString(),
      name: participant.name,
      batchType: participant.batchType,
      paymentStatus: participant.paymentStatus,
      registeredAt: participant.createdAt,
      rollNumber: participant.rollNumber || null,
    };

    if (participant.paymentStatus === 'COMPLETED') {
      const admitCard = generateAdmitCardData({
        id: participant._id.toString(),
        rollNumber: participant.rollNumber ?? null,
        name: participant.name,
        class: participant.class,
        batchType: participant.batchType,
        guardianName: participant.guardianName,
        address: participant.address,
        mobileNumber: participant.mobileNumber,
        paymentStatus: participant.paymentStatus,
        photoUrl: participant.photoUrl,
        createdAt: participant.createdAt,
        updatedAt: participant.updatedAt,
      });
      return res.json({ ...base, admitCard });
    }

    if (participant.paymentStatus === 'PENDING') {
      // Return redirect URL if payment was already initiated
      const redirectUrl = participant.merchantTransactionId
        ? `${process.env.FRONTEND_URL}/payment-redirects/${participant.merchantTransactionId}`
        : null;
      return res.json({ ...base, redirectUrl, canResumePayment: !!redirectUrl });
    }

    // FAILED
    return res.json({
      ...base,
      retryMessage: 'Your previous payment failed. Please try registering again.',
      retryUrl: `${process.env.FRONTEND_URL}/`,
    });
  } catch (err) {
    console.error('[registration/track]', err);
    return res.status(500).json({ error: 'Failed to retrieve registration status' });
  }
});

// ─── GET /api/registration/admit-card/:id ────────────────────────────────────
registrationRouter.get('/admit-card/:id', async (req: SessionRequest, res: Response) => {
  try {
    const { id } = req.params;
    const participant = await Participant.findById(id);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(403).json({ error: 'Admit card not available. Payment not completed.' });
    }

    const admitCardData = generateAdmitCardData({
      id: participant._id.toString(),
      rollNumber: participant.rollNumber ?? null,
      name: participant.name,
      class: participant.class,
      batchType: participant.batchType,
      guardianName: participant.guardianName,
      address: participant.address,
      mobileNumber: participant.mobileNumber,
      paymentStatus: participant.paymentStatus,
      photoUrl: participant.photoUrl,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    });

    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(generateAdmitCardHtml(admitCardData));
    }

    return res.json({ admitCard: admitCardData });
  } catch (err) {
    console.error('[registration/admit-card]', err);
    return res.status(500).json({ error: 'Failed to retrieve admit card' });
  }
});

// ─── Deprecated stubs ─────────────────────────────────────────────────────────
registrationRouter.post('/', async (_req, res) => {
  return res.status(410).json({ error: 'This endpoint is deprecated. Use POST /api/otp/send to start registration.' });
});

registrationRouter.post('/verify-otp', async (_req, res) => {
  return res.status(410).json({ error: 'This endpoint is deprecated. Use POST /api/otp/verify.' });
});

registrationRouter.post('/confirm-payment', async (_req, res) => {
  return res.status(410).json({ error: 'This endpoint is no longer used. Payment is confirmed via PhonePe callback.' });
});


// ─── GET /api/registration/admit-card/:id/download ──────────────────────────
// Download admit card as PDF
registrationRouter.get('/admit-card/:id/download', async (req: SessionRequest, res: Response) => {
  try {
    const { id } = req.params;
    const participant = await Participant.findById(id);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(403).json({ error: 'Admit card not available. Payment not completed.' });
    }

    // Get event details from portal config
    const portalConfig = await PortalConfig.findOne().lean();
    
    const eventDate = portalConfig?.eventDate 
      ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : undefined;

    const pdfBuffer = await generateAdmitCardPDF({
      rollNumber: participant.rollNumber ?? 'N/A',
      name: participant.name,
      class: participant.class,
      batchType: participant.batchType,
      guardianName: participant.guardianName,
      mobileNumber: participant.mobileNumber,
      photoUrl: participant.photoUrl,
      eventName: 'Quiz Champ 2026',
      eventDate,
      eventTime: portalConfig?.eventTime,
      reportingTime: portalConfig?.reportingTime,
      examTime: portalConfig?.examTime,
      venue: portalConfig?.venue,
      venueMapUrl: portalConfig?.venueMapUrl,
      participantId: participant._id.toString(),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="admit-card-${participant.rollNumber}.pdf"`);

    // Track admit card download — triggers important dates + location on each fresh download
    if (!participant.admitCardDownloaded) {
      participant.admitCardDownloaded = true;
      await participant.save();

      const portalConfig = await PortalConfig.findOne().lean();

      // 1. Send important dates
      try {
        const lastDate = portalConfig?.closingDate
          ? new Date(portalConfig.closingDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
          : 'Not Declared';
        const examDate = portalConfig?.eventDate
          ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
          : 'Not Declared';
        const prizeDate = portalConfig?.prizeDistributionDate
          ? new Date(portalConfig.prizeDistributionDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
          : 'Not Declared';
        const contactNumber = portalConfig?.callContactNumber || portalConfig?.whatsappSupportNumber || 'Not Available';

        await sendImportantDates(participant.mobileNumber, {
          year: '2026',
          lastDateToApply: lastDate,
          examDate,
          prizeDistributionDate: prizeDate,
          contactNumber,
        });
        console.log(`[Admit Card] Important dates sent to ${participant.mobileNumber}`);
      } catch (datesErr) {
        console.error('[Admit Card] Failed to send important dates:', datesErr);
      }

      // 2. Send event location (independent of important dates)
      try {
        const venue = portalConfig?.venue;
        const venueMapUrl = portalConfig?.venueMapUrl;

        if (venue && venueMapUrl) {
          // Extract suffix: support maps.app.goo.gl/xxx or any URL — use last path segment
          let mapShortSuffix = venueMapUrl;
          const gooGlMatch = venueMapUrl.match(/maps\.app\.goo\.gl\/(.+)/);
          if (gooGlMatch) {
            mapShortSuffix = gooGlMatch[1];
          }

          await sendEventLocation(participant.mobileNumber, {
            name: participant.name,
            eventType: 'Examination Venue',
            address: venue,
            mapUrl: venueMapUrl,
            mapShortSuffix,
          });
          console.log(`[Admit Card] Location sent to ${participant.mobileNumber}`);
        } else {
          console.log(`[Admit Card] Skipping location — venue or map URL not configured`);
        }
      } catch (locErr) {
        console.error('[Admit Card] Failed to send location:', locErr);
      }
    }

    res.send(pdfBuffer);
  } catch (err) {
    console.error('[registration/admit-card/download]', err);
    return res.status(500).json({ error: 'Failed to generate admit card PDF' });
  }
});

// POST /api/registration/group-joined/:id — marks participant as having joined the WhatsApp group
registrationRouter.post('/group-joined/:id', async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ error: 'Only registered participants can join the group' });
    }

    participant.groupJoined = true;
    await participant.save();

    return res.json({ message: 'Group join recorded', name: participant.name });
  } catch (err) {
    console.error('[registration/group-joined]', err);
    return res.status(500).json({ error: 'Failed to record group join' });
  }
});
