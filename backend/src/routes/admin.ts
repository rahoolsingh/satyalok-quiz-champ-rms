import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { AdminUser, PortalConfig, SliderImage, Participant, Result, IPortalConfig } from '../db/models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateImageFormat } from '../services/validation';
import { isValidRollNumber } from '../services/rollNumber';
import { uploadToS3, deleteFromS3 } from '../services/storage';
import { ManualStatus } from '../types';

export const adminRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

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
    const { batch, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));

    const filter: Record<string, unknown> = {};
    if (batch && ['JUNIOR', 'SENIOR'].includes(batch as string)) {
      filter.batchType = batch;
    }
    if (search) {
      const s = search as string;
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { rollNumber: s },
        { mobileNumber: s },
      ];
    }

    const [participants, total, juniorCount, seniorCount] = await Promise.all([
      Participant.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Participant.countDocuments(filter),
      Participant.countDocuments({ batchType: 'JUNIOR' }),
      Participant.countDocuments({ batchType: 'SENIOR' }),
    ]);

    return res.json({
      participants: participants.map((p) => ({
        id: p._id.toString(),
        rollNumber: p.rollNumber,
        name: p.name,
        class: p.class,
        batchType: p.batchType,
        guardianName: p.guardianName,
        mobileNumber: p.mobileNumber,
        email: p.email,
        paymentStatus: p.paymentStatus,
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
