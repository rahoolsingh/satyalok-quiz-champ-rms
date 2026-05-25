import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { Mcq } from '../db/models';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const mcqRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/mcq/admin — list all MCQs with optional filters
mcqRouter.get('/admin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { batchType, class: cls, subject, search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(500, parseInt(limit as string, 10));

    const filter: Record<string, unknown> = {};
    if (batchType && ['JUNIOR', 'SENIOR', 'BOTH'].includes(batchType as string)) {
      filter.batchType = batchType;
    }
    if (cls) filter.class = cls;
    if (subject) filter.subject = subject;
    if (search) {
      const s = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.question = { $regex: s, $options: 'i' };
    }

    const [mcqs, total] = await Promise.all([
      Mcq.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Mcq.countDocuments(filter),
    ]);

    return res.json({
      mcqs: mcqs.map((m) => ({
        id: m._id.toString(),
        question: m.question,
        options: m.options,
        correctAnswer: m.correctAnswer,
        class: m.class,
        batchType: m.batchType,
        subject: m.subject,
        isActive: m.isActive,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch MCQs' });
  }
});

// POST /api/mcq/admin — create single MCQ
mcqRouter.post('/admin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { question, options, correctAnswer, class: cls, batchType, subject } = req.body;
    if (!question || !options || !correctAnswer) {
      return res.status(400).json({ error: 'Question, options, and correctAnswer are required' });
    }
    if (!options.A || !options.B || !options.C || !options.D) {
      return res.status(400).json({ error: 'All four options (A, B, C, D) are required' });
    }
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return res.status(400).json({ error: 'correctAnswer must be A, B, C, or D' });
    }

    const mcq = await Mcq.create({ question, options, correctAnswer, class: cls, batchType, subject });

    return res.status(201).json({
      id: mcq._id.toString(),
      question: mcq.question,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      class: mcq.class,
      batchType: mcq.batchType,
      subject: mcq.subject,
      isActive: mcq.isActive,
      createdAt: mcq.createdAt,
      updatedAt: mcq.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create MCQ' });
  }
});

// PUT /api/mcq/admin/:id — update single MCQ
mcqRouter.put('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { question, options, correctAnswer, class: cls, batchType, subject, isActive } = req.body;
    const updateData: Record<string, unknown> = {};
    if (question !== undefined) updateData.question = question;
    if (options !== undefined) updateData.options = options;
    if (correctAnswer !== undefined) {
      if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        return res.status(400).json({ error: 'correctAnswer must be A, B, C, or D' });
      }
      updateData.correctAnswer = correctAnswer;
    }
    if (cls !== undefined) updateData.class = cls;
    if (batchType !== undefined) updateData.batchType = batchType;
    if (subject !== undefined) updateData.subject = subject;
    if (isActive !== undefined) updateData.isActive = isActive;

    const mcq = await Mcq.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!mcq) return res.status(404).json({ error: 'MCQ not found' });

    return res.json({
      id: mcq._id.toString(),
      question: mcq.question,
      options: mcq.options,
      correctAnswer: mcq.correctAnswer,
      class: mcq.class,
      batchType: mcq.batchType,
      subject: mcq.subject,
      isActive: mcq.isActive,
      createdAt: mcq.createdAt,
      updatedAt: mcq.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update MCQ' });
  }
});

// DELETE /api/mcq/admin/:id — delete single MCQ
mcqRouter.delete('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const mcq = await Mcq.findByIdAndDelete(req.params.id);
    if (!mcq) return res.status(404).json({ error: 'MCQ not found' });
    return res.json({ message: 'MCQ deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete MCQ' });
  }
});

// POST /api/mcq/admin/import — bulk import CSV
mcqRouter.post('/admin/import', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

    const mode = req.body.mode || 'append'; // 'append' or 'replace'
    const fileContent = req.file.buffer.toString('utf-8');

    let records: Array<Record<string, string>>;
    try {
      records = parse(fileContent, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      return res.status(400).json({ error: 'Invalid CSV format' });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Validate columns
    const requiredCols = ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer'];
    const headers = Object.keys(records[0]);
    const missing = requiredCols.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missing.join(', ')}. Required: ${requiredCols.join(', ')}`,
      });
    }

    const validAnswers = ['A', 'B', 'C', 'D'];
    const errors: Array<{ row: number; error: string }> = [];
    const toInsert: Array<Record<string, unknown>> = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const rowNum = i + 2; // +2 because 1-indexed + header row

      if (!r.question.trim()) {
        errors.push({ row: rowNum, error: 'Question is empty' });
        continue;
      }
      if (!r.optionA.trim() || !r.optionB.trim() || !r.optionC.trim() || !r.optionD.trim()) {
        errors.push({ row: rowNum, error: 'All four options (A, B, C, D) are required' });
        continue;
      }
      const ans = r.correctAnswer.trim().toUpperCase();
      if (!validAnswers.includes(ans)) {
        errors.push({ row: rowNum, error: `correctAnswer must be A, B, C, or D, got "${r.correctAnswer}"` });
        continue;
      }

      toInsert.push({
        question: r.question.trim(),
        options: {
          A: r.optionA.trim(),
          B: r.optionB.trim(),
          C: r.optionC.trim(),
          D: r.optionD.trim(),
        },
        correctAnswer: ans,
        class: (r.class || '').trim() || undefined,
        batchType: (r.batchType || '').trim().toUpperCase() || undefined,
        subject: (r.subject || '').trim() || undefined,
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: `Validation failed. ${errors.length} row(s) have errors.`,
        rowErrors: errors,
        validCount: toInsert.length,
      });
    }

    // Apply mode
    if (mode === 'replace') {
      await Mcq.deleteMany({});
    }

    const result = await Mcq.insertMany(toInsert);

    return res.json({
      message: `${result.length} MCQ(s) imported successfully (mode: ${mode})`,
      count: result.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to import MCQs' });
  }
});

// GET /api/mcq/admin/export — export all MCQs as CSV
mcqRouter.get('/admin/export', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { batchType, class: cls, subject } = req.query;
    const filter: Record<string, unknown> = {};
    if (batchType && ['JUNIOR', 'SENIOR', 'BOTH'].includes(batchType as string)) {
      filter.batchType = batchType;
    }
    if (cls) filter.class = cls;
    if (subject) filter.subject = subject;

    const mcqs = await Mcq.find(filter).sort({ createdAt: -1 }).lean();

    const header = 'question,optionA,optionB,optionC,optionD,correctAnswer,class,batchType,subject';
    const rows = mcqs.map((m) => {
      const escape = (v: string | undefined) => {
        if (!v) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };
      return [
        escape(m.question),
        escape(m.options.A),
        escape(m.options.B),
        escape(m.options.C),
        escape(m.options.D),
        escape(m.correctAnswer),
        escape(m.class),
        escape(m.batchType),
        escape(m.subject),
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="mcqs.csv"');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to export MCQs' });
  }
});
