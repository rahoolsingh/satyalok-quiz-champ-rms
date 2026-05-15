import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { AdminUser, PortalConfig, SliderImage, Participant, Result, IPortalConfig } from '../db/models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateImageFormat } from '../services/validation';
import { isValidRollNumber } from '../services/rollNumber';
import { sendGroupInvite, sendAdmitCardReminder, sendPaymentReminder } from '../services/whatsapp';
import { getPortalConfig } from '../services/portalState';
import { uploadToS3, deleteFromS3 } from '../services/storage';
import { ManualStatus } from '../types';

export const adminRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
const DEFAULT_FEE_JUNIOR = 100;
const DEFAULT_FEE_SENIOR = 150;
const DEFAULT_FRONTEND_URL = 'https://quizchamp.satyalok.in';

const manualPaymentReminderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment reminder requests. Please try again later.' },
  keyGenerator: (req) => (req as AuthRequest).adminId || req.ip || 'unknown',
});

// POST /api/admin/login
adminRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await AdminUser.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    admin.lastLoginAt = new Date();
    await admin.save();

    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as string;
    const token = jwt.sign(
      { adminId: admin._id.toString(), username: admin.username },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    return res.json({ token, username: admin.username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

adminRouter.use(authMiddleware);

// PUT /api/admin/portal/dates
adminRouter.put('/portal/dates', async (req: AuthRequest, res: Response) => {
  try {
    const { openingDate, closingDate } = req.body;
    if (!openingDate || !closingDate) {
      return res.status(400).json({ error: 'Opening date and closing date are required' });
    }

    const opening = new Date(openingDate);
    const closing = new Date(closingDate);
    if (isNaN(opening.getTime()) || isNaN(closing.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (closing <= opening) {
      return res.status(400).json({ error: 'Closing date must be after opening date' });
    }

    await PortalConfig.findOneAndUpdate(
      {},
      { openingDate: opening, closingDate: closing },
      { upsert: true, new: true }
    );

    return res.json({ message: 'Portal dates updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update portal dates' });
  }
});

// PUT /api/admin/portal/status
adminRouter.put('/portal/status', async (req: AuthRequest, res: Response) => {
  try {
    const { manualStatus } = req.body;
    const validStatuses: ManualStatus[] = ['AUTO', 'COUNTDOWN', 'OPEN', 'CLOSED'];
    if (!validStatuses.includes(manualStatus)) {
      return res.status(400).json({ error: 'Invalid status. Must be AUTO, COUNTDOWN, OPEN, or CLOSED' });
    }

    const config = await PortalConfig.findOne();
    if (!config) return res.status(404).json({ error: 'Portal not configured' });

    config.manualStatus = manualStatus;
    await config.save();

    return res.json({ message: 'Portal status updated', manualStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update portal status' });
  }
});

// POST /api/admin/slider/upload  — uploads to AWS S3
adminRouter.post('/slider/upload', upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    if (!validateImageFormat(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file format. Only JPEG, PNG, and WebP are allowed.' });
    }

    const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const s3Key = `slider/${uuidv4()}.${ext}`;
    const { url } = await uploadToS3(s3Key, req.file.buffer, req.file.mimetype);

    const maxDoc = await SliderImage.findOne().sort({ displayOrder: -1 });
    const nextOrder = maxDoc ? maxDoc.displayOrder + 1 : 0;

    const image = await SliderImage.create({ imageUrl: url, s3Key, displayOrder: nextOrder });

    return res.status(201).json({
      message: 'Image uploaded',
      image: { id: image._id.toString(), imageUrl: image.imageUrl, displayOrder: image.displayOrder },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

// DELETE /api/admin/slider/:id
adminRouter.delete('/slider/:id', async (req: AuthRequest, res: Response) => {
  try {
    const image = await SliderImage.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    // Delete from S3
    await deleteFromS3(image.s3Key);
    await image.deleteOne();

    return res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
});

// PUT /api/admin/slider/reorder
adminRouter.put('/slider/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array of { id, displayOrder }' });
    }
    for (const item of order) {
      await SliderImage.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder });
    }
    return res.json({ message: 'Slider order updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to reorder slider images' });
  }
});

// POST /api/admin/results/upload
adminRouter.post('/results/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Result file is required' });

    const fileContent = req.file.buffer.toString('utf-8');
    let records: Array<{ rollNumber: string; score: string; rank?: string; remarks?: string }>;

    try {
      records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      return res.status(400).json({ error: 'Invalid CSV format' });
    }

    const invalidRolls: string[] = [];
    const validatedRecords: Array<{
      rollNumber: string; score: number; rank?: number; remarks?: string; participantId: string;
    }> = [];

    for (const record of records) {
      if (!record.rollNumber || !isValidRollNumber(record.rollNumber)) {
        invalidRolls.push(record.rollNumber || '(empty)');
        continue;
      }
      const participant = await Participant.findOne({
        rollNumber: record.rollNumber,
        paymentStatus: 'COMPLETED',
      });
      if (!participant) {
        invalidRolls.push(record.rollNumber);
      } else {
        validatedRecords.push({
          rollNumber: record.rollNumber,
          score: parseInt(record.score, 10) || 0,
          rank: record.rank ? parseInt(record.rank, 10) : undefined,
          remarks: record.remarks,
          participantId: participant._id.toString(),
        });
      }
    }

    if (invalidRolls.length > 0) {
      return res.status(400).json({
        error: 'Validation failed: some roll numbers are invalid or not found',
        invalidRollNumbers: invalidRolls,
      });
    }

    for (const rec of validatedRecords) {
      await Result.findOneAndUpdate(
        { participantId: rec.participantId },
        { rollNumber: rec.rollNumber, score: rec.score, rank: rec.rank, remarks: rec.remarks },
        { upsert: true }
      );
    }

    return res.json({ message: `${validatedRecords.length} results uploaded successfully` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to upload results' });
  }
});

// PUT /api/admin/results/publish
adminRouter.put('/results/publish', async (req: AuthRequest, res: Response) => {
  try {
    const pubDate = req.body.publicationDate ? new Date(req.body.publicationDate) : new Date();
    if (isNaN(pubDate.getTime())) {
      return res.status(400).json({ error: 'Invalid publication date' });
    }

    const config = await PortalConfig.findOne();
    if (!config) return res.status(404).json({ error: 'Portal not configured' });

    config.resultPublicationDate = pubDate;
    await config.save();

    await Result.updateMany({ publishedAt: { $exists: false } }, { $set: { publishedAt: pubDate } });

    return res.json({ message: 'Results publication date set', publicationDate: pubDate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to set publication date' });
  }
});

// GET /api/admin/portal/fees
adminRouter.get('/portal/fees', async (_req: AuthRequest, res: Response) => {
  try {
    const config = await PortalConfig.findOne().lean();
    return res.json({
      feeJunior: config?.feeJunior ?? 100,
      feeSenior: config?.feeSenior ?? 150,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get fees' });
  }
});

// PUT /api/admin/portal/fees
adminRouter.put('/portal/fees', async (req: AuthRequest, res: Response) => {
  try {
    const { feeJunior, feeSenior } = req.body;
    if (typeof feeJunior !== 'number' || typeof feeSenior !== 'number') {
      return res.status(400).json({ error: 'feeJunior and feeSenior must be numbers' });
    }
    if (feeJunior <= 0 || feeSenior <= 0) {
      return res.status(400).json({ error: 'Fees must be greater than 0' });
    }
    await PortalConfig.findOneAndUpdate(
      {},
      { feeJunior, feeSenior },
      { upsert: true, new: true }
    );
    return res.json({ message: 'Fees updated successfully', feeJunior, feeSenior });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update fees' });
  }
});

// GET /api/admin/portal/event-details
adminRouter.get('/portal/event-details', async (_req: AuthRequest, res: Response) => {
  try {
    const config = await PortalConfig.findOne().lean();
    return res.json({
      eventDate: config?.eventDate,
      eventTime: config?.eventTime,
      venue: config?.venue,
      venueMapUrl: config?.venueMapUrl,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get event details' });
  }
});

// PUT /api/admin/portal/event-details
adminRouter.put('/portal/event-details', async (req: AuthRequest, res: Response) => {
  try {
    const { eventDate, eventTime, venue, venueMapUrl } = req.body;
    
    const updateData: Partial<IPortalConfig> = {};
    
    if (eventDate) {
      const date = new Date(eventDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid event date format' });
      }
      updateData.eventDate = date;
    }
    
    if (eventTime !== undefined) updateData.eventTime = eventTime;
    if (venue !== undefined) updateData.venue = venue;
    if (venueMapUrl !== undefined) updateData.venueMapUrl = venueMapUrl;
    
    await PortalConfig.findOneAndUpdate(
      {},
      updateData,
      { upsert: true, new: true }
    );
    
    return res.json({ message: 'Event details updated successfully', ...updateData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update event details' });
  }
});

// GET /api/admin/registrations
adminRouter.get('/registrations', async (req: AuthRequest, res: Response) => {
  try {
    const { batch, search, page = '1', limit = '20', status, admitCardDownloaded } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));

    const filter: Record<string, unknown> = {};
    if (batch && ['JUNIOR', 'SENIOR'].includes(batch as string)) {
      filter.batchType = batch;
    }
    if (status) {
      const statuses = (status as string).split(',').filter(s => ['COMPLETED', 'PENDING', 'FAILED'].includes(s));
      if (statuses.length === 1) {
        filter.paymentStatus = statuses[0];
      } else if (statuses.length > 1) {
        filter.paymentStatus = { $in: statuses };
      }
    }
    if (admitCardDownloaded === 'true') {
      filter.admitCardDownloaded = true;
    } else if (admitCardDownloaded === 'false') {
      filter.admitCardDownloaded = false;
      if (!filter.paymentStatus) {
        filter.paymentStatus = 'COMPLETED';
      }
    }
    if (search) {
      const s = search as string;
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { rollNumber: { $regex: s, $options: 'i' } },
        { mobileNumber: { $regex: s, $options: 'i' } },
        { guardianName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
      ];
    }

    const [participants, total, juniorCount, seniorCount] = await Promise.all([
      Participant.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Participant.countDocuments(filter),
      Participant.countDocuments({ batchType: 'JUNIOR', paymentStatus: 'COMPLETED' }),
      Participant.countDocuments({ batchType: 'SENIOR', paymentStatus: 'COMPLETED' }),
    ]);

    return res.json({
      participants: participants.map((p) => ({
        id: p._id.toString(),
        rollNumber: p.rollNumber,
        name: p.name,
        class: p.class,
        batchType: p.batchType,
        guardianName: p.guardianName,
        address: p.address,
        mobileNumber: p.mobileNumber,
        email: p.email,
        photoUrl: p.photoUrl,
        paymentStatus: p.paymentStatus,
        groupInviteSent: p.groupInviteSent || false,
        admitCardDownloaded: p.admitCardDownloaded || false,
        createdAt: p.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      counts: { junior: juniorCount, senior: seniorCount },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get registrations' });
  }
});

// POST /api/admin/registrations/:id/send-group-invite
adminRouter.post('/registrations/:id/send-group-invite', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.groupInviteSent) {
      return res.status(409).json({ error: 'Group invite already sent to this participant' });
    }

    await sendGroupInvite(participant.mobileNumber);

    participant.groupInviteSent = true;
    await participant.save();

    return res.json({ message: 'Group invite sent successfully' });
  } catch (err) {
    console.error('[Admin] Failed to send group invite:', err);
    return res.status(500).json({ error: 'Failed to send group invite' });
  }
});

// POST /api/admin/registrations/:id/remind-admit-card
adminRouter.post('/registrations/:id/remind-admit-card', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.admitCardDownloaded) {
      return res.status(409).json({ error: 'Admit card already downloaded' });
    }

    // Check 24-hour cooldown
    if (participant.lastAdmitCardReminderAt) {
      const hoursSinceLast = (Date.now() - new Date(participant.lastAdmitCardReminderAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 24) {
        const hoursLeft = Math.ceil(24 - hoursSinceLast);
        return res.status(429).json({ error: `Reminder already sent. Try again in ${hoursLeft}h.` });
      }
    }

    await sendAdmitCardReminder(participant.mobileNumber, participant.name);

    participant.lastAdmitCardReminderAt = new Date();
    await participant.save();

    return res.json({ message: 'Admit card reminder sent' });
  } catch (err) {
    console.error('[Admin] Failed to send admit card reminder:', err);
    return res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// POST /api/admin/registrations/:id/remind-payment
adminRouter.post('/registrations/:id/remind-payment', manualPaymentReminderLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: 'Payment reminder can only be sent for pending payments' });
    }

    if (!participant.merchantTransactionId) {
      return res.status(400).json({ error: 'No pending payment transaction found for this participant' });
    }

    const portalConfig = await getPortalConfig();
    const amount = participant.batchType === 'JUNIOR'
      ? (portalConfig?.feeJunior ?? DEFAULT_FEE_JUNIOR)
      : (portalConfig?.feeSenior ?? DEFAULT_FEE_SENIOR);

    const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
    const paymentUrl = `${frontendUrl}/payment-status?participantId=${participant._id.toString()}`;

    await sendPaymentReminder(participant.mobileNumber, {
      name: participant.name,
      amount,
      paymentUrl,
    });

    participant.paymentReminderSent = true;
    await participant.save();

    return res.json({ message: 'Payment reminder sent successfully' });
  } catch (err) {
    console.error('[Admin] Failed to send payment reminder:', err);
    return res.status(500).json({ error: 'Failed to send payment reminder' });
  }
});
