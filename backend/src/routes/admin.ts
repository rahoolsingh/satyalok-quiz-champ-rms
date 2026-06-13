import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { AdminUser, PortalConfig, SliderImage, Participant, Result, IPortalConfig, AdminSession, PaymentAttempt } from '../db/models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateImageFormat } from '../services/validation';
import { isValidRollNumber } from '../services/rollNumber';
import { sendGroupInvite, sendAdmitCardReminder, sendPaymentReminder, sendThankYouMessage, sendImportantDates, sendEventLocation, sendGeneralTemplate } from '../services/whatsapp';
import { getPortalConfig } from '../services/portalState';
import { startAdmitCardQueue, getAdmitCardQueueStatus, stopAdmitCardQueue, resetAdmitCardQueueState } from '../services/admitCardQueue';
import { uploadToS3, deleteFromS3 } from '../services/storage';
import { ManualStatus } from '../types';

export const adminRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
const DEFAULT_FEE_JUNIOR = 100;
const DEFAULT_FEE_SENIOR = 150;
const DEFAULT_FRONTEND_URL = 'https://quizchamp.satyalok.in';
const escapeRegex = (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
type TrendRange = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'EVENT_START';

/**
 * Parses a date string as IST (UTC+5:30).
 * If no timezone info present, treats it as IST.
 */
function parseAsIST(dateStr: string): Date {
  if (/[Z+-]\d{2}:\d{2}$/.test(dateStr) || dateStr.endsWith('Z')) {
    return new Date(dateStr);
  }
  // Date-only format (YYYY-MM-DD) — append T00:00:00+05:30
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00+05:30');
  }
  // DateTime without timezone (e.g., 2026-06-02T23:59) — append +05:30
  return new Date(dateStr + '+05:30');
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

const startOfUtcDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const startOfUtcHour = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));

const startOfUtcIsoWeek = (date: Date): Date => {
  const dayStart = startOfUtcDay(date);
  const day = dayStart.getUTCDay() || 7; // Sunday -> 7
  return new Date(dayStart.getTime() - (day - 1) * ONE_DAY_MS);
};

const formatTrendKey = (date: Date, range: TrendRange): string => {
  if (range === 'DAILY') {
    return `${date.toISOString().slice(0, 13)}:00Z`;
  }
  if (range === 'EVENT_START') {
    const weekStart = startOfUtcIsoWeek(date);
    const isoThursday = new Date(weekStart.getTime() + 3 * ONE_DAY_MS);
    const isoYear = isoThursday.getUTCFullYear();
    const yearStart = startOfUtcIsoWeek(new Date(Date.UTC(isoYear, 0, 4)));
    const weekNo = Math.floor((weekStart.getTime() - yearStart.getTime()) / (7 * ONE_DAY_MS)) + 1;
    return `${isoYear}-W${String(weekNo).padStart(2, '0')}`;
  }
  return date.toISOString().slice(0, 10);
};

const formatTrendLabel = (date: Date, range: TrendRange): string => {
  if (range === 'DAILY') {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  }
  if (range === 'EVENT_START') {
    const weekEnd = new Date(date.getTime() + 6 * ONE_DAY_MS);
    return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })} - ${weekEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

const getTrendSetup = (range: TrendRange, eventStart?: Date | null) => {
  const now = new Date();
  const buckets: Array<{ key: string; label: string; start: Date }> = [];
  let startDate: Date;

  if (range === 'DAILY') {
    startDate = startOfUtcHour(new Date(now.getTime() - 23 * ONE_HOUR_MS));
    for (let i = 0; i < 24; i += 1) {
      const bucketDate = new Date(startDate.getTime() + i * ONE_HOUR_MS);
      buckets.push({ key: formatTrendKey(bucketDate, range), label: formatTrendLabel(bucketDate, range), start: bucketDate });
    }
  } else if (range === 'WEEKLY') {
    startDate = startOfUtcDay(new Date(now.getTime() - 6 * ONE_DAY_MS));
    for (let i = 0; i < 7; i += 1) {
      const bucketDate = new Date(startDate.getTime() + i * ONE_DAY_MS);
      buckets.push({ key: formatTrendKey(bucketDate, range), label: formatTrendLabel(bucketDate, range), start: bucketDate });
    }
  } else if (range === 'MONTHLY') {
    startDate = startOfUtcDay(new Date(now.getTime() - 29 * ONE_DAY_MS));
    for (let i = 0; i < 30; i += 1) {
      const bucketDate = new Date(startDate.getTime() + i * ONE_DAY_MS);
      buckets.push({ key: formatTrendKey(bucketDate, range), label: formatTrendLabel(bucketDate, range), start: bucketDate });
    }
  } else {
    const openingStart = eventStart ? startOfUtcIsoWeek(eventStart) : startOfUtcIsoWeek(new Date(now.getTime() - 8 * 7 * ONE_DAY_MS));
    const currentWeekStart = startOfUtcIsoWeek(now);
    startDate = openingStart;
    for (let t = openingStart.getTime(); t <= currentWeekStart.getTime(); t += 7 * ONE_DAY_MS) {
      const bucketDate = new Date(t);
      buckets.push({ key: formatTrendKey(bucketDate, range), label: formatTrendLabel(bucketDate, range), start: bucketDate });
    }
    if (buckets.length === 0) {
      buckets.push({ key: formatTrendKey(currentWeekStart, range), label: formatTrendLabel(currentWeekStart, range), start: currentWeekStart });
    }
  }

  return { startDate, buckets };
};

const getTrendKeyExpression = (range: TrendRange) => {
  if (range === 'DAILY') {
    return { $dateToString: { format: '%Y-%m-%dT%H:00Z', date: '$createdAt', timezone: 'UTC' } };
  }
  if (range === 'EVENT_START') {
    return {
      $concat: [
        { $toString: { $isoWeekYear: '$createdAt' } },
        '-W',
        {
          $cond: [
            { $lt: [{ $isoWeek: '$createdAt' }, 10] },
            { $concat: ['0', { $toString: { $isoWeek: '$createdAt' } }] },
            { $toString: { $isoWeek: '$createdAt' } },
          ],
        },
      ],
    };
  }
  return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } };
};

const manualPaymentReminderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment reminder requests. Please try again later.' },
  keyGenerator: (req) => (req as AuthRequest).adminId || req.ip || 'unknown',
});

const admitCardQueueResetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many queue reset requests. Please try again later.' },
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
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string;
    const token = jwt.sign(
      { adminId: admin._id.toString(), username: admin.username },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    // Track session
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || '';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await AdminSession.create({
      adminId: admin._id.toString(),
      token,
      deviceInfo,
      ipAddress,
      expiresAt,
    });

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

    const opening = parseAsIST(openingDate);
    const closing = parseAsIST(closingDate);
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
    let records: Array<{ rollNumber: string; score: string; positiveMarks?: string; negativeMarks?: string; rank?: string; remarks?: string }>;

    try {
      records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      return res.status(400).json({ error: 'Invalid CSV format' });
    }

    const invalidRolls: string[] = [];
    const validatedRecords: Array<{
      rollNumber: string; score: number; positiveMarks?: number; negativeMarks?: number; rank?: number; remarks?: string; participantId: string;
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
          positiveMarks: record.positiveMarks !== undefined ? parseFloat(record.positiveMarks) : undefined,
          negativeMarks: record.negativeMarks !== undefined ? parseFloat(record.negativeMarks) : undefined,
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
        { rollNumber: rec.rollNumber, score: rec.score, positiveMarks: rec.positiveMarks, negativeMarks: rec.negativeMarks, rank: rec.rank, remarks: rec.remarks },
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

// POST /api/admin/results/scan
adminRouter.post('/results/scan', upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { qrData, score, positiveMarks, negativeMarks, rank, remarks } = req.body;

    if (!qrData) return res.status(400).json({ error: 'QR data is required' });
    if (score === undefined || score === null) return res.status(400).json({ error: 'Score is required' });

    // Parse QR Data
    let parsed: { id?: string; roll?: string; batch?: string } | null = null;
    try {
      parsed = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ error: 'Invalid QR code data format' });
    }

    if (!parsed || (!parsed.id && !parsed.roll)) {
      return res.status(400).json({ error: 'Invalid QR code. Participant ID or Roll Number missing.' });
    }

    let participant;
    if (parsed.id) {
      participant = await Participant.findById(parsed.id);
    }
    if (!participant && parsed.roll) {
      participant = await Participant.findOne({ rollNumber: parsed.roll });
    }

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    let answerSheetUrl: string | undefined = undefined;

    // Handle optional image upload
    if (req.file) {
      if (!validateImageFormat(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file format. Only JPEG, PNG, and WebP are allowed.' });
      }
      const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
      const s3Key = `results/${participant.rollNumber || participant._id}_${Date.now()}.${ext}`;
      const uploadRes = await uploadToS3(s3Key, req.file.buffer, req.file.mimetype);
      answerSheetUrl = uploadRes.url;
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore)) return res.status(400).json({ error: 'Score must be a number' });

    const numericPositiveMarks = positiveMarks !== undefined ? parseFloat(positiveMarks) : undefined;
    const numericNegativeMarks = negativeMarks !== undefined ? parseFloat(negativeMarks) : undefined;

    const numericRank = rank ? parseInt(rank, 10) : undefined;

    // Upsert Result
    const updateData: any = {
      rollNumber: participant.rollNumber || 'UNKNOWN',
      score: numericScore,
      positiveMarks: numericPositiveMarks,
      negativeMarks: numericNegativeMarks,
      rank: numericRank,
      remarks,
    };
    if (answerSheetUrl) updateData.answerSheetUrl = answerSheetUrl;

    const result = await Result.findOneAndUpdate(
      { participantId: participant._id },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: 'Result saved successfully',
      result: {
        id: result._id.toString(),
        participantId: result.participantId.toString(),
        rollNumber: result.rollNumber,
        score: result.score,
        positiveMarks: result.positiveMarks,
        negativeMarks: result.negativeMarks,
        rank: result.rank,
        remarks: result.remarks,
        answerSheetUrl: result.answerSheetUrl,
      },
      participant: {
        name: participant.name,
        batchType: participant.batchType,
      }
    });
  } catch (err) {
    console.error('[results/scan]', err);
    return res.status(500).json({ error: 'Failed to process scanned result' });
  }
});

// GET /api/admin/results/export
adminRouter.get('/results/export', async (req: AuthRequest, res: Response) => {
  try {
    const { batch, search, sortBy = 'score', sortOrder = 'desc' } = req.query;

    const matchStage: any = {};
    if (search) {
      const s = escapeRegex(search as string);
      matchStage['$or'] = [
        { 'participant.name': { $regex: s, $options: 'i' } },
        { rollNumber: { $regex: s, $options: 'i' } },
      ];
    }
    if (batch && ['JUNIOR', 'SENIOR'].includes(batch as string)) {
      matchStage['participant.batchType'] = batch;
    }

    const sortConfig: any = {};
    if (sortBy === 'score') {
      sortConfig.score = sortOrder === 'asc' ? 1 : -1;
      sortConfig.negativeMarks = 1; // tie breaker
    }
    else if (sortBy === 'rank') sortConfig.calculatedRank = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'name') sortConfig['participant.name'] = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'rollNumber') sortConfig.rollNumber = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'createdAt') sortConfig.createdAt = sortOrder === 'asc' ? 1 : -1;
    else {
      sortConfig.score = -1;
      sortConfig.negativeMarks = 1;
    }

    const pipeline = [
      {
        $lookup: {
          from: 'participants',
          localField: 'participantId',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
      {
        $addFields: {
          compositeScore: {
            $subtract: [
              { $multiply: ['$score', 100000] },
              { $ifNull: ['$negativeMarks', 0] }
            ]
          }
        }
      },
      {
        $setWindowFields: {
          partitionBy: '$participant.batchType',
          sortBy: { compositeScore: -1 },
          output: {
            calculatedRank: { $denseRank: {} },
          },
        },
      },
      { $match: matchStage },
      { $sort: sortConfig },
    ];

    const records = await Result.aggregate(pipeline as any[]);

    const csvRows = [
      'Rank,Roll Number,Name,Class,Batch,Score,Correct Answers,Incorrect Answers,Answer Sheet URL,Remarks',
      ...records.map(r => [
        r.calculatedRank || '',
        r.rollNumber || '',
        `"${(r.participant?.name || '').replace(/"/g, '""')}"`,
        r.participant?.class || '',
        r.participant?.batchType || '',
        r.score !== undefined ? r.score : '',
        r.positiveMarks !== undefined ? r.positiveMarks : '',
        r.negativeMarks !== undefined ? r.negativeMarks : '',
        r.answerSheetUrl || '',
        `"${(r.remarks || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const filename = `quiz-results-${batch || 'ALL'}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvRows.join('\n'));
  } catch (err) {
    console.error('[results export GET]', err);
    return res.status(500).json({ error: 'Failed to export results data' });
  }
});

// GET /api/admin/results
adminRouter.get('/results', async (req: AuthRequest, res: Response) => {
  try {
    const { batch, search, page = '1', limit = '50', sortBy = 'score', sortOrder = 'desc' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));

    const matchStage: any = {};
    if (search) {
      const s = escapeRegex(search as string);
      matchStage['$or'] = [
        { 'participant.name': { $regex: s, $options: 'i' } },
        { rollNumber: { $regex: s, $options: 'i' } },
      ];
    }
    if (batch && ['JUNIOR', 'SENIOR'].includes(batch as string)) {
      matchStage['participant.batchType'] = batch;
    }

    const sortConfig: any = {};
    if (sortBy === 'score') {
      sortConfig.score = sortOrder === 'asc' ? 1 : -1;
      sortConfig.negativeMarks = 1; // tie breaker
    }
    else if (sortBy === 'rank') sortConfig.calculatedRank = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'name') sortConfig['participant.name'] = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'rollNumber') sortConfig.rollNumber = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'createdAt') sortConfig.createdAt = sortOrder === 'asc' ? 1 : -1;
    else {
      sortConfig.score = -1;
      sortConfig.negativeMarks = 1;
    }

    const pipeline = [
      {
        $lookup: {
          from: 'participants',
          localField: 'participantId',
          foreignField: '_id',
          as: 'participant',
        },
      },
      { $unwind: '$participant' },
      {
        $addFields: {
          compositeScore: {
            $subtract: [
              { $multiply: ['$score', 100000] },
              { $ifNull: ['$negativeMarks', 0] }
            ]
          }
        }
      },
      {
        $setWindowFields: {
          partitionBy: '$participant.batchType',
          sortBy: { compositeScore: -1 },
          output: {
            calculatedRank: { $denseRank: {} },
          },
        },
      },
      { $match: matchStage },
    ];

    const [totalResults, records] = await Promise.all([
      Result.aggregate([...pipeline, { $count: 'total' }] as any[]),
      Result.aggregate([
        ...pipeline,
        { $sort: sortConfig },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
        {
          $project: {
            _id: 1,
            participantId: 1,
            rollNumber: 1,
            score: 1,
            positiveMarks: 1,
            negativeMarks: 1,
            calculatedRank: 1,
            answerSheetUrl: 1,
            publishedAt: 1,
            'participant.name': 1,
            'participant.batchType': 1,
            'participant.class': 1,
            'participant.photoUrl': 1,
          },
        },
      ] as any[]),
    ]);

    const total = totalResults.length > 0 ? totalResults[0].total : 0;

    return res.json({
      results: records.map(r => ({
        id: r._id.toString(),
        participantId: r.participantId.toString(),
        rollNumber: r.rollNumber,
        score: r.score,
        positiveMarks: r.positiveMarks,
        negativeMarks: r.negativeMarks,
        rank: r.calculatedRank,
        answerSheetUrl: r.answerSheetUrl,
        publishedAt: r.publishedAt,
        participantName: r.participant.name,
        batchType: r.participant.batchType,
        participantClass: r.participant.class,
        participantPhotoUrl: r.participant.photoUrl,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('[results GET]', err);
    return res.status(500).json({ error: 'Failed to retrieve results' });
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
      reportingTime: config?.reportingTime,
      examTime: config?.examTime,
      venue: config?.venue,
      venueMapUrl: config?.venueMapUrl,
      prizeDistributionDate: config?.prizeDistributionDate,
      prizeDistributionTime: config?.prizeDistributionTime,
      prizeDistributionVenue: config?.prizeDistributionVenue,
      prizeDistributionMapUrl: config?.prizeDistributionMapUrl,
      whatsappSupportName: config?.whatsappSupportName,
      whatsappSupportNumber: config?.whatsappSupportNumber,
      callContactName: config?.callContactName,
      callContactNumber: config?.callContactNumber,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get event details' });
  }
});

// PUT /api/admin/portal/event-details
adminRouter.put('/portal/event-details', async (req: AuthRequest, res: Response) => {
  try {
    const { eventDate, eventTime, reportingTime, examTime, venue, venueMapUrl, prizeDistributionDate, prizeDistributionTime, prizeDistributionVenue, prizeDistributionMapUrl, whatsappSupportName, whatsappSupportNumber, callContactName, callContactNumber } = req.body;
    
    const updateData: Partial<IPortalConfig> = {};
    
    if (eventDate) {
      const date = parseAsIST(eventDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid event date format' });
      }
      updateData.eventDate = date;
    }
    
    if (eventTime !== undefined) updateData.eventTime = eventTime;
    if (reportingTime !== undefined) updateData.reportingTime = reportingTime;
    if (examTime !== undefined) updateData.examTime = examTime;
    if (venue !== undefined) updateData.venue = venue;
    if (venueMapUrl !== undefined) updateData.venueMapUrl = venueMapUrl;
    if (prizeDistributionDate !== undefined) {
      if (prizeDistributionDate) {
        const date = parseAsIST(prizeDistributionDate);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ error: 'Invalid prize distribution date format' });
        }
        updateData.prizeDistributionDate = date;
      } else {
        updateData.prizeDistributionDate = undefined;
      }
    }
    if (prizeDistributionTime !== undefined) updateData.prizeDistributionTime = prizeDistributionTime;
    if (prizeDistributionVenue !== undefined) updateData.prizeDistributionVenue = prizeDistributionVenue;
    if (prizeDistributionMapUrl !== undefined) updateData.prizeDistributionMapUrl = prizeDistributionMapUrl;
    if (whatsappSupportName !== undefined) updateData.whatsappSupportName = whatsappSupportName;
    if (whatsappSupportNumber !== undefined) updateData.whatsappSupportNumber = whatsappSupportNumber;
    if (callContactName !== undefined) updateData.callContactName = callContactName;
    if (callContactNumber !== undefined) updateData.callContactNumber = callContactNumber;
    
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

// GET /api/admin/registrations/vcard
adminRouter.get('/registrations/vcard', async (req: AuthRequest, res: Response) => {
  try {
    const { batch, search } = req.query;

    const filter: Record<string, unknown> = {
      paymentStatus: 'COMPLETED',
    };
    if (batch && ['JUNIOR', 'SENIOR'].includes(batch as string)) {
      filter.batchType = batch;
    }
    if (search) {
      const s = escapeRegex(search as string);
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { rollNumber: { $regex: s, $options: 'i' } },
        { mobileNumber: { $regex: s, $options: 'i' } },
        { guardianName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { merchantTransactionId: { $regex: s, $options: 'i' } },
      ];
    }

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'results',
          localField: '_id',
          foreignField: 'participantId',
          as: 'result',
        },
      },
      {
        $unwind: {
          path: '$result',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          compositeScore: {
            $cond: {
              if: { $gt: ['$result.score', null] },
              then: {
                $subtract: [
                  { $multiply: ['$result.score', 100000] },
                  { $ifNull: ['$result.negativeMarks', 0] }
                ]
              },
              else: -999999
            }
          }
        }
      },
      {
        $setWindowFields: {
          partitionBy: '$batchType',
          sortBy: { compositeScore: -1 },
          output: {
            calculatedRank: { $denseRank: {} },
          },
        },
      },
      { $sort: { name: 1 } }
    ];

    const participants = await Participant.aggregate(pipeline as any[]);
    
    const currentYear = new Date().getFullYear();
    const vcardContent = participants.map((p) => {
      const prefix = `quizchamp_${currentYear}`;
      const fullName = `${prefix}_${p.name}`;
      const formattedN = `;${fullName};;;`;

      let phone = p.mobileNumber.trim();
      if (/^\d{10}$/.test(phone)) {
        phone = `+91${phone}`;
      } else if (/^91\d{10}$/.test(phone)) {
        phone = `+${phone}`;
      } else if (!phone.startsWith('+')) {
        phone = `+91${phone}`;
      }

      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${fullName}`,
        `N:${formattedN}`,
        `TEL;TYPE=CELL,VOICE:${phone}`,
      ];

      if (p.email) {
        lines.push(`EMAIL;TYPE=PREF,INTERNET:${p.email.trim()}`);
      }

      const notesList = [
        `Roll Number: ${p.rollNumber || 'N/A'}`,
        `Class: ${p.class || 'N/A'}`,
        `Batch: ${p.batchType || 'N/A'}`,
        `Guardian: ${p.guardianName || 'N/A'}`,
      ];

      if (p.result && typeof p.result.score === 'number') {
        notesList.push(`Score: ${p.result.score}`);
        const rank = p.result.rank || p.calculatedRank;
        if (rank && p.compositeScore > -999999) {
          notesList.push(`Rank: #${rank}`);
        }
      }

      const notes = notesList.join(', ');
      lines.push(`NOTE:${notes}`);

      lines.push('END:VCARD');
      return lines.join('\r\n');
    }).join('\r\n');

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="quizchamp_${currentYear}_contacts.vcf"`);
    return res.send(vcardContent);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate vCard' });
  }
});

// GET /api/admin/registrations
adminRouter.get('/registrations', async (req: AuthRequest, res: Response) => {
  try {
    const { batch, search, page = '1', limit = '20', status, admitCardDownloaded, trendRange = 'EVENT_START' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const normalizedTrendRange: TrendRange = (['DAILY', 'WEEKLY', 'MONTHLY', 'EVENT_START'].includes(trendRange as string)
      ? trendRange
      : 'EVENT_START') as TrendRange;

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
    }
    if (search) {
      const s = escapeRegex(search as string);
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { rollNumber: { $regex: s, $options: 'i' } },
        { mobileNumber: { $regex: s, $options: 'i' } },
        { guardianName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { merchantTransactionId: { $regex: s, $options: 'i' } },
      ];
    }

    const [portalConfig, earliestParticipant, participants, total, juniorCount, seniorCount, completedCount, pendingCount, failedCount, notDownloadedCount, femaleCount, maleCount, formsFilledCount, hindiCount, englishCount] = await Promise.all([
      PortalConfig.findOne({}, { openingDate: 1 }).lean(),
      Participant.findOne({}, { createdAt: 1 }).sort({ createdAt: 1 }).lean(),
      Participant.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Participant.countDocuments(filter),
      Participant.countDocuments({ batchType: 'JUNIOR', paymentStatus: 'COMPLETED' }),
      Participant.countDocuments({ batchType: 'SENIOR', paymentStatus: 'COMPLETED' }),
      Participant.countDocuments({ paymentStatus: 'COMPLETED' }),
      Participant.countDocuments({ paymentStatus: 'PENDING' }),
      Participant.countDocuments({ paymentStatus: 'FAILED' }),
      Participant.countDocuments({ paymentStatus: 'COMPLETED', admitCardDownloaded: false }),
      Participant.countDocuments({ paymentStatus: 'COMPLETED', gender: 'FEMALE' }),
      Participant.countDocuments({ paymentStatus: 'COMPLETED', gender: 'MALE' }),
      Participant.countDocuments({}),
      Participant.countDocuments({ questionPaperLanguage: 'HINDI' }),
      Participant.countDocuments({ questionPaperLanguage: 'ENGLISH' }),
    ]);

    const eventStart = portalConfig?.openingDate || earliestParticipant?.createdAt || undefined;
    const trendSetup = getTrendSetup(normalizedTrendRange, eventStart);
    const trendKeyExpression = getTrendKeyExpression(normalizedTrendRange);
    const trendRows = await Participant.aggregate([
      { $match: { createdAt: { $gte: trendSetup.startDate } } },
      {
        $group: {
          _id: trendKeyExpression,
          formsFilled: { $sum: 1 },
          registrationsCompleted: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'COMPLETED'] }, 1, 0] },
          },
        },
      },
    ]);

    const trendMap = new Map(
      trendRows.map((row: { _id: string; formsFilled: number; registrationsCompleted: number }) => [
        row._id,
        { formsFilled: row.formsFilled, registrationsCompleted: row.registrationsCompleted },
      ])
    );

    return res.json({
      participants: participants.map((p) => ({
        id: p._id.toString(),
        rollNumber: p.rollNumber,
        name: p.name,
        class: p.class,
        batchType: p.batchType,
        gender: p.gender,
        guardianName: p.guardianName,
        address: p.address,
        mobileNumber: p.mobileNumber,
        email: p.email,
        referralSource: p.referralSource,
        photoUrl: p.photoUrl,
        paymentStatus: p.paymentStatus,
        merchantTransactionId: p.merchantTransactionId || null,
        questionPaperLanguage: p.questionPaperLanguage,
        groupInviteSent: p.groupInviteSent || false,
        groupJoined: p.groupJoined || false,
        admitCardDownloaded: p.admitCardDownloaded || false,
        createdAt: p.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      counts: { junior: juniorCount, senior: seniorCount },
      metrics: {
        completed: completedCount,
        pending: pendingCount,
        failed: failedCount,
        admitCardNotDownloaded: notDownloadedCount,
        female: femaleCount,
        male: maleCount,
        formsFilled: formsFilledCount,
        hindi: hindiCount,
        english: englishCount,
      },
      trendRange: normalizedTrendRange,
      trends: trendSetup.buckets.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
        formsFilled: trendMap.get(bucket.key)?.formsFilled || 0,
        registrationsCompleted: trendMap.get(bucket.key)?.registrationsCompleted || 0,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get registrations' });
  }
});

// POST /api/admin/registrations/send-prize-location-bulk — send prize distribution venue/map to all completed registrations
adminRouter.post('/registrations/send-prize-location-bulk', async (req: AuthRequest, res: Response) => {
  try {
    const portalConfig = await PortalConfig.findOne({});
    const venue = portalConfig?.prizeDistributionVenue;
    const venueMapUrl = portalConfig?.prizeDistributionMapUrl;

    if (!venue || !venueMapUrl) {
      return res.status(400).json({ error: 'Prize distribution venue or map URL is not configured' });
    }

    const participants = await Participant.find({ paymentStatus: 'COMPLETED' });
    if (participants.length === 0) {
      return res.json({ message: 'No completed registrations found to send details' });
    }

    const dateStr = portalConfig?.prizeDistributionDate
      ? new Date(portalConfig.prizeDistributionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
      : 'TBA';
    const timeStr = portalConfig?.prizeDistributionTime || 'TBA';
    const venueStr = portalConfig?.prizeDistributionVenue || 'TBA';
    const mapUrlStr = portalConfig?.prizeDistributionMapUrl || 'TBA';

    console.log(`[Bulk Prize Location] Starting bulk send to ${participants.length} participants...`);

    // Respond immediately to avoid request timeouts
    res.json({ message: `Bulk send started in background for ${participants.length} participants` });

    // Background sending execution loop
    (async () => {
      let sentCount = 0;
      let failedCount = 0;
      for (const participant of participants) {
        try {
          const bodyText = `Congratulations on completing the Quiz Champ! You are cordially invited to the Prize Distribution Ceremony. Prizes are awarded to all rank holders from 1st to 13th rank. 📍 Venue Details & Time: Date: ${dateStr}, Time: ${timeStr}, Venue: ${venueStr}, Map Location: ${mapUrlStr}`;

          await sendGeneralTemplate(participant.mobileNumber, bodyText);
          sentCount++;
          // Pause slightly to rate-limit calls to Meta
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`[Bulk Prize Location] Failed to send to ${participant.mobileNumber}:`, err);
          failedCount++;
        }
      }
      console.log(`[Bulk Prize Location] Completed bulk send. Success: ${sentCount}, Failed: ${failedCount}`);
    })();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to initiate bulk send' });
  }
});

// POST /api/admin/registrations/:id/send-prize-location — send prize distribution venue/map to individual registration
adminRouter.post('/registrations/:id/send-prize-location', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const portalConfig = await PortalConfig.findOne({});
    const venue = portalConfig?.prizeDistributionVenue;
    const venueMapUrl = portalConfig?.prizeDistributionMapUrl;

    if (!venue || !venueMapUrl) {
      return res.status(400).json({ error: 'Prize distribution venue or map URL is not configured' });
    }

    const dateStr = portalConfig?.prizeDistributionDate
      ? new Date(portalConfig.prizeDistributionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
      : 'TBA';
    const timeStr = portalConfig?.prizeDistributionTime || 'TBA';
    const venueStr = portalConfig?.prizeDistributionVenue || 'TBA';
    const mapUrlStr = portalConfig?.prizeDistributionMapUrl || 'TBA';

    const bodyText = `Congratulations on completing the Quiz Champ! You are cordially invited to the Prize Distribution Ceremony. Prizes are awarded to all rank holders from 1st to 13th rank. 📍 Venue Details & Time: Date: ${dateStr}, Time: ${timeStr}, Venue: ${venueStr}, Map Location: ${mapUrlStr}`;

    await sendGeneralTemplate(participant.mobileNumber, bodyText);

    return res.json({ message: 'Prize distribution location details sent successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send prize distribution location details' });
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

    await sendGroupInvite(participant.mobileNumber, participant._id.toString());

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

    const portalConfig = await PortalConfig.findOne().lean();

    await sendAdmitCardReminder(participant.mobileNumber, {
      name: participant.name,
      rollNumber: participant.rollNumber || '',
      batchType: participant.batchType,
      eventDate: portalConfig?.eventDate
        ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
        : 'To be announced',
    });

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
      batchType: participant.batchType,
    });

    participant.paymentReminderSent = true;
    await participant.save();

    return res.json({ message: 'Payment reminder sent successfully' });
  } catch (err) {
    console.error('[Admin] Failed to send payment reminder:', err);
    return res.status(500).json({ error: 'Failed to send payment reminder' });
  }
});

// ─── GOD MODE: Resend endpoints (no rate limits, no cooldowns) ────────────────

// POST /api/admin/registrations/:id/resend-payment-confirmation
adminRouter.post('/registrations/:id/resend-payment-confirmation', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only resend confirmation for completed payments' });
    }

    const portalConfig = await PortalConfig.findOne().lean();
    const amount = participant.batchType === 'JUNIOR'
      ? (portalConfig?.feeJunior ?? DEFAULT_FEE_JUNIOR)
      : (portalConfig?.feeSenior ?? DEFAULT_FEE_SENIOR);

    const eventDate = portalConfig?.eventDate
      ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
      : 'To be announced';
    const eventTime = portalConfig?.eventTime || 'To be announced';
    const venue = portalConfig?.venue || 'To be announced';
    const portalUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;

    await sendThankYouMessage(participant.mobileNumber, {
      name: participant.name,
      rollNumber: participant.rollNumber || '',
      admitCardUrl: `${portalUrl}/api/registration/admit-card/${participant._id}`,
      portalUrl,
      eventDate,
      eventTime,
      venue,
      amount,
    });

    return res.json({ message: 'Payment confirmation resent successfully' });
  } catch (err) {
    console.error('[Admin GodMode] Failed to resend payment confirmation:', err);
    return res.status(500).json({ error: 'Failed to resend payment confirmation' });
  }
});

// POST /api/admin/registrations/:id/resend-group-invite
adminRouter.post('/registrations/:id/resend-group-invite', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only send group invite for completed registrations' });
    }

    await sendGroupInvite(participant.mobileNumber, participant._id.toString());

    return res.json({ message: 'Group invite resent successfully' });
  } catch (err) {
    console.error('[Admin GodMode] Failed to resend group invite:', err);
    return res.status(500).json({ error: 'Failed to resend group invite' });
  }
});

// POST /api/admin/registrations/:id/resend-admit-card-reminder — no cooldown (god mode)
adminRouter.post('/registrations/:id/resend-admit-card-reminder', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only send admit card reminder for completed registrations' });
    }

    const portalConfig = await PortalConfig.findOne().lean();

    await sendAdmitCardReminder(participant.mobileNumber, {
      name: participant.name,
      rollNumber: participant.rollNumber || '',
      batchType: participant.batchType,
      eventDate: portalConfig?.eventDate
        ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
        : 'To be announced',
    });

    return res.json({ message: 'Admit card reminder resent successfully' });
  } catch (err) {
    console.error('[Admin GodMode] Failed to resend admit card reminder:', err);
    return res.status(500).json({ error: 'Failed to resend admit card reminder' });
  }
});

// POST /api/admin/registrations/:id/resend-payment-reminder — no cooldown (god mode)
adminRouter.post('/registrations/:id/resend-payment-reminder', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
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
      batchType: participant.batchType,
    });

    return res.json({ message: 'Payment reminder resent successfully' });
  } catch (err) {
    console.error('[Admin GodMode] Failed to resend payment reminder:', err);
    return res.status(500).json({ error: 'Failed to resend payment reminder' });
  }
});

// POST /api/admin/registrations/:id/send-important-dates — 24h cooldown
adminRouter.post('/registrations/:id/send-important-dates', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only send to completed registrations' });
    }

    // 24h cooldown
    if (participant.lastImportantDatesSentAt) {
      const hoursSinceLast = (Date.now() - new Date(participant.lastImportantDatesSentAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 24) {
        const hoursLeft = Math.ceil(24 - hoursSinceLast);
        return res.status(429).json({ error: `Already sent. Try again in ${hoursLeft}h.` });
      }
    }

    const portalConfig = await PortalConfig.findOne().lean();

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

    // If datesChanged flag is set, clear admit card download status
    if (req.body.datesChanged) {
      participant.admitCardDownloaded = false;
    }

    participant.lastImportantDatesSentAt = new Date();
    await participant.save();

    return res.json({ message: 'Important dates sent successfully' });
  } catch (err) {
    console.error('[Admin] Failed to send important dates:', err);
    return res.status(500).json({ error: 'Failed to send important dates' });
  }
});

// POST /api/admin/registrations/:id/resend-important-dates — god mode, no limit
adminRouter.post('/registrations/:id/resend-important-dates', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only send to completed registrations' });
    }

    const portalConfig = await PortalConfig.findOne().lean();

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

    if (req.body.datesChanged) {
      participant.admitCardDownloaded = false;
      await participant.save();
    }

    return res.json({ message: 'Important dates resent successfully' });
  } catch (err) {
    console.error('[Admin GodMode] Failed to resend important dates:', err);
    return res.status(500).json({ error: 'Failed to resend important dates' });
  }
});

// ─── SESSION MANAGEMENT ───────────────────────────────────────────────────────

// GET /api/admin/sessions — list all active sessions for current admin
adminRouter.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await AdminSession.find({
      adminId: req.adminId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActiveAt: -1 }).lean();

    const currentToken = req.headers.authorization?.split(' ')[1];

    return res.json({
      sessions: sessions.map(s => ({
        id: s._id.toString(),
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        isCurrent: s.token === currentToken,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// POST /api/admin/sessions/expire-all — expire all sessions except current
adminRouter.post('/sessions/expire-all', async (req: AuthRequest, res: Response) => {
  try {
    const currentToken = req.headers.authorization?.split(' ')[1];

    await AdminSession.updateMany(
      { adminId: req.adminId, token: { $ne: currentToken }, isActive: true },
      { $set: { isActive: false } }
    );

    return res.json({ message: 'All other sessions expired' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to expire sessions' });
  }
});

// POST /api/admin/sessions/:id/expire — expire a specific session
adminRouter.post('/sessions/:id/expire', async (req: AuthRequest, res: Response) => {
  try {
    const session = await AdminSession.findOne({ _id: req.params.id, adminId: req.adminId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.isActive = false;
    await session.save();

    return res.json({ message: 'Session expired' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to expire session' });
  }
});

// POST /api/admin/registrations/:id/verify-payment — manually verify payment with gateway
adminRouter.post('/registrations/:id/verify-payment', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus === 'COMPLETED') {
      return res.json({ message: 'Payment already verified as COMPLETED', status: 'COMPLETED' });
    }

    // Get all payment attempts for this participant
    const attempts = await PaymentAttempt.find({
      participantId: participant._id.toString(),
      status: { $in: ['INITIATED', 'PENDING'] },
    }).sort({ createdAt: -1 });

    // Also check the current merchantTransactionId if not in attempts
    const txIds = new Set(attempts.map(a => a.merchantTransactionId));
    if (participant.merchantTransactionId && !txIds.has(participant.merchantTransactionId)) {
      txIds.add(participant.merchantTransactionId);
    }

    if (txIds.size === 0) {
      return res.status(400).json({ error: 'No transaction IDs found for this participant' });
    }

    const { verifyPaymentStatus, processPaymentVerification } = await import('../services/paymentVerification');

    // Check all transaction IDs with the gateway
    for (const txId of txIds) {
      try {
        const paymentStatus = await verifyPaymentStatus(txId);

        if (paymentStatus.status === 'SUCCESS') {
          // Update the participant's merchantTransactionId to the successful one
          participant.merchantTransactionId = txId;
          await participant.save();

          // Update attempt record
          await PaymentAttempt.findOneAndUpdate(
            { merchantTransactionId: txId },
            { status: 'SUCCESS', verifiedAt: new Date(), gatewayResponse: JSON.stringify(paymentStatus) }
          );

          // Process the full verification flow
          await processPaymentVerification(txId);

          return res.json({
            message: `Payment verified as SUCCESS (Transaction: ${txId}). Status updated to COMPLETED.`,
            status: 'SUCCESS',
            transactionId: txId,
            checkedCount: txIds.size,
          });
        } else if (paymentStatus.status === 'FAILED') {
          await PaymentAttempt.findOneAndUpdate(
            { merchantTransactionId: txId },
            { status: 'FAILED', verifiedAt: new Date() }
          );
        }
      } catch (err) {
        console.error(`[Admin] Error checking ${txId}:`, err);
      }
    }

    return res.json({
      message: `Checked ${txIds.size} transaction(s). No successful payment found.`,
      status: 'PENDING',
      checkedCount: txIds.size,
    });
  } catch (err) {
    console.error('[Admin] Failed to verify payment:', err);
    return res.status(500).json({ error: 'Failed to verify payment with gateway' });
  }
});

// POST /api/admin/registrations/:id/generate-payment-token — generate a unique link for a pending user
adminRouter.post('/registrations/:id/generate-payment-token', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    if (participant.paymentStatus === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot generate payment link for a completed registration' });
    }

    const force = req.body.force === true || req.body.force === 'true';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const tokenAgeLimit = 5 * 60 * 60 * 1000; // 5 hours

    let token = participant.paymentToken;
    let createdAt = participant.paymentTokenCreatedAt;

    const isTokenValid = token && createdAt && (Date.now() - new Date(createdAt).getTime() < tokenAgeLimit);

    if (isTokenValid && !force) {
      // Return existing valid token and its expiration
      const validTillDate = new Date(createdAt.getTime() + tokenAgeLimit);
      const validTill = validTillDate.toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      return res.json({
        success: true,
        token,
        paymentLink: `${frontendUrl}/checkout/${token}`,
        validTill,
        message: 'Retrieved existing valid payment link.'
      });
    }

    // Generate new token if not valid or forced
    token = uuidv4().replace(/-/g, '') + Date.now().toString(36);
    participant.paymentToken = token;
    participant.paymentTokenCreatedAt = new Date();
    participant.markModified('paymentToken');
    participant.markModified('paymentTokenCreatedAt');
    await participant.save();

    const validTillDate = new Date(participant.paymentTokenCreatedAt.getTime() + tokenAgeLimit);
    const validTill = validTillDate.toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return res.json({
      success: true,
      token,
      paymentLink: `${frontendUrl}/checkout/${token}`,
      validTill,
      message: force ? 'Regenerated fresh payment link.' : 'Generated new payment link.'
    });
  } catch (err) {
    console.error('[Admin] Failed to generate payment token:', err);
    return res.status(500).json({ error: 'Failed to generate payment token' });
  }
});

// ─── FAQ MANAGEMENT ───────────────────────────────────────────────────────────

// GET /api/admin/faqs
adminRouter.get('/faqs', async (_req: AuthRequest, res: Response) => {
  try {
    const faqs = await (await import('../db/models')).FAQ.find().sort({ displayOrder: 1 }).lean();
    return res.json({ faqs: faqs.map(f => ({ id: f._id.toString(), question: f.question, answer: f.answer, isPublished: f.isPublished, displayOrder: f.displayOrder })) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get FAQs' });
  }
});

// POST /api/admin/faqs
adminRouter.post('/faqs', async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required' });
    const maxOrder = await (await import('../db/models')).FAQ.findOne().sort({ displayOrder: -1 }).lean();
    const faq = await (await import('../db/models')).FAQ.create({ question, answer, displayOrder: (maxOrder?.displayOrder ?? 0) + 1 });
    return res.status(201).json({ id: faq._id.toString(), question: faq.question, answer: faq.answer, isPublished: faq.isPublished, displayOrder: faq.displayOrder });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// PUT /api/admin/faqs/:id
adminRouter.put('/faqs/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, isPublished, displayOrder } = req.body;
    const update: Record<string, unknown> = {};
    if (question !== undefined) update.question = question;
    if (answer !== undefined) update.answer = answer;
    if (isPublished !== undefined) update.isPublished = isPublished;
    if (displayOrder !== undefined) update.displayOrder = displayOrder;
    await (await import('../db/models')).FAQ.findByIdAndUpdate(req.params.id, update);
    return res.json({ message: 'FAQ updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// DELETE /api/admin/faqs/:id
adminRouter.delete('/faqs/:id', async (req: AuthRequest, res: Response) => {
  try {
    await (await import('../db/models')).FAQ.findByIdAndDelete(req.params.id);
    return res.json({ message: 'FAQ deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ─── CUSTOM MESSAGE ───────────────────────────────────────────────────────────

// POST /api/admin/registrations/:id/send-custom-message
adminRouter.post('/registrations/:id/send-custom-message', async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const { sendCustomMessage } = await import('../services/whatsapp');
    await sendCustomMessage(participant.mobileNumber, message.trim());

    return res.json({ message: 'Custom message sent successfully' });
  } catch (err) {
    console.error('[Admin] Failed to send custom message:', err);
    return res.status(500).json({ error: 'Failed to send custom message' });
  }
});

// ─── ADMIT CARD WHATSAPP QUEUE ────────────────────────────────────────────────

// GET /api/admin/registrations/:id/download-admit-card
adminRouter.get('/registrations/:id/download-admit-card', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    if (!participant.rollNumber) return res.status(400).json({ error: 'Roll number not assigned' });

    const { generateAdmitCardPDF } = await import('../services/admitCardPdf');
    const portalConfig = await PortalConfig.findOne().lean();

    const pdfBuffer = await generateAdmitCardPDF({
      rollNumber: participant.rollNumber,
      name: participant.name,
      class: participant.class,
      batchType: participant.batchType,
      guardianName: participant.guardianName,
      mobileNumber: participant.mobileNumber,
      photoUrl: participant.photoUrl,
      eventName: 'Quiz Champ 2026',
      eventDate: portalConfig?.eventDate
        ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
        : undefined,
      eventTime: portalConfig?.eventTime,
      reportingTime: portalConfig?.reportingTime,
      examTime: portalConfig?.examTime,
      venue: portalConfig?.venue,
      venueMapUrl: portalConfig?.venueMapUrl,
      participantId: participant._id.toString(),
      questionPaperLanguage: participant.questionPaperLanguage,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AdmitCard_${participant.rollNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[Admin] Failed to download admit card:', err);
    return res.status(500).json({ error: 'Failed to generate admit card' });
  }
});

// POST /api/admin/admit-card-queue/start
adminRouter.post('/admit-card-queue/start', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await startAdmitCardQueue();
    return res.json(result);
  } catch (err) {
    console.error('[Admin] Failed to start admit card queue:', err);
    return res.status(500).json({ error: 'Failed to start queue' });
  }
});

// GET /api/admin/admit-card-queue/status
adminRouter.get('/admit-card-queue/status', async (_req: AuthRequest, res: Response) => {
  return res.json(getAdmitCardQueueStatus());
});

// POST /api/admin/admit-card-queue/stop
adminRouter.post('/admit-card-queue/stop', async (_req: AuthRequest, res: Response) => {
  stopAdmitCardQueue();
  return res.json({ message: 'Queue stop requested' });
});

// POST /api/admin/admit-card-queue/reset
adminRouter.post('/admit-card-queue/reset', admitCardQueueResetLimiter, async (_req: AuthRequest, res: Response) => {
  try {
    const queueStatus = getAdmitCardQueueStatus();
    if (queueStatus.running) {
      return res.status(409).json({ error: 'Queue is running. Stop the queue before reset.' });
    }
    resetAdmitCardQueueState();
    const result = await Participant.updateMany(
      {
        paymentStatus: 'COMPLETED',
        rollNumber: { $exists: true, $ne: null },
        admitCardWhatsappSentAt: { $exists: true },
      },
      {
        $unset: { admitCardWhatsappSentAt: 1 },
      }
    );

    return res.json({
      message: `Queue reset complete. ${result.modifiedCount} admit card send statuses cleared.`,
      resetCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('[Admin] Failed to reset admit card queue:', err);
    return res.status(500).json({ error: 'Failed to reset queue' });
  }
});

// POST /api/admin/registrations/:id/send-admit-card-whatsapp
adminRouter.post('/registrations/:id/send-admit-card-whatsapp', async (req: AuthRequest, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    if (participant.paymentStatus !== 'COMPLETED') return res.status(400).json({ error: 'Payment not completed' });
    if (!participant.rollNumber) return res.status(400).json({ error: 'Roll number not assigned' });

    const isGodMode = req.body?.godMode === true;

    // 24-hour rate limit (bypass in god mode)
    if (!isGodMode && participant.admitCardWhatsappSentAt) {
      const hoursAgo = (Date.now() - new Date(participant.admitCardWhatsappSentAt).getTime()) / 3600000;
      if (hoursAgo < 24) {
        const hoursLeft = Math.ceil(24 - hoursAgo);
        return res.status(429).json({ error: `Admit card already sent. Resend available in ${hoursLeft}h.` });
      }
    }

    const { generateAdmitCardPDF } = await import('../services/admitCardPdf');
    const { sendAdmitCardWhatsApp } = await import('../services/whatsapp');
    const portalConfig = await PortalConfig.findOne().lean();

    const admitCardData = {
      rollNumber: participant.rollNumber,
      name: participant.name,
      class: participant.class,
      batchType: participant.batchType,
      guardianName: participant.guardianName,
      mobileNumber: participant.mobileNumber,
      photoUrl: participant.photoUrl,
      eventName: 'Quiz Champ 2026',
      eventDate: portalConfig?.eventDate
        ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
        : undefined,
      eventTime: portalConfig?.eventTime,
      reportingTime: portalConfig?.reportingTime,
      examTime: portalConfig?.examTime,
      venue: portalConfig?.venue,
      venueMapUrl: portalConfig?.venueMapUrl,
      participantId: participant._id.toString(),
      questionPaperLanguage: participant.questionPaperLanguage,
    };

    const pdfBuffer = await generateAdmitCardPDF(admitCardData);
    const examDate = portalConfig?.eventDate
      ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
      : 'To be announced';

    await sendAdmitCardWhatsApp(
      participant.mobileNumber,
      pdfBuffer,
      `AdmitCard_${participant.rollNumber}`,
      { name: participant.name, rollNumber: participant.rollNumber, batchType: participant.batchType, examDate }
    );

    participant.admitCardWhatsappSentAt = new Date();
    await participant.save();

    return res.json({ message: 'Admit card sent on WhatsApp' });
  } catch (err) {
    console.error('[Admin] Failed to send admit card on WhatsApp:', err);
    return res.status(500).json({ error: 'Failed to send admit card' });
  }
});
