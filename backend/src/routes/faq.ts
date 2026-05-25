import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { FAQ } from '../db/models';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const faqRouter = Router();

// GET /api/faq — public, returns published FAQs
faqRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const faqs = await FAQ.find({ isPublished: true })
      .sort({ displayOrder: 1 })
      .lean();
    return res.json(
      faqs.map((f) => ({
        id: f._id.toString(),
        question: f.question,
        answer: f.answer,
        displayOrder: f.displayOrder,
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Admin routes (protected)
faqRouter.get('/admin', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const faqs = await FAQ.find().sort({ displayOrder: 1 }).lean();
    return res.json(
      faqs.map((f) => ({
        id: f._id.toString(),
        question: f.question,
        answer: f.answer,
        displayOrder: f.displayOrder,
        isPublished: f.isPublished,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// POST /api/admin/faq — create new FAQ
faqRouter.post('/admin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, displayOrder, isPublished } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const maxDoc = await FAQ.findOne().sort({ displayOrder: -1 });
    const nextOrder = displayOrder ?? (maxDoc ? maxDoc.displayOrder + 1 : 0);

    const faq = await FAQ.create({
      question,
      answer,
      displayOrder: nextOrder,
      isPublished: isPublished ?? true,
    });

    return res.status(201).json({
      id: faq._id.toString(),
      question: faq.question,
      answer: faq.answer,
      displayOrder: faq.displayOrder,
      isPublished: faq.isPublished,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// PUT /api/admin/faq/:id — update FAQ
faqRouter.put('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, displayOrder, isPublished } = req.body;
    const updateData: Record<string, unknown> = {};
    if (question !== undefined) updateData.question = question;
    if (answer !== undefined) updateData.answer = answer;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const faq = await FAQ.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    return res.json({
      id: faq._id.toString(),
      question: faq.question,
      answer: faq.answer,
      displayOrder: faq.displayOrder,
      isPublished: faq.isPublished,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// DELETE /api/admin/faq/:id — delete FAQ
faqRouter.delete('/admin/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    return res.json({ message: 'FAQ deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// POST /api/admin/faq/import — bulk import FAQs from CSV
faqRouter.post('/admin/import', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });

    const mode = req.body.mode || 'append';
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

    const requiredCols = ['question', 'answer'];
    const headers = Object.keys(records[0]);
    const missing = requiredCols.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required columns: ${missing.join(', ')}. Required: question, answer`,
      });
    }

    const errors: Array<{ row: number; error: string }> = [];
    const toInsert: Array<Record<string, unknown>> = [];

    const maxDoc = await FAQ.findOne().sort({ displayOrder: -1 });
    let nextOrder = maxDoc ? maxDoc.displayOrder + 1 : 0;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const rowNum = i + 2;
      if (!r.question.trim() || !r.answer.trim()) {
        errors.push({ row: rowNum, error: 'Question and answer are required' });
        continue;
      }
      toInsert.push({
        question: r.question.trim(),
        answer: r.answer.trim(),
        displayOrder: nextOrder++,
        isPublished: r.isPublished ? r.isPublished.trim().toLowerCase() === 'true' : true,
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: `Validation failed. ${errors.length} row(s) have errors.`,
        rowErrors: errors,
        validCount: toInsert.length,
      });
    }

    if (mode === 'replace') {
      await FAQ.deleteMany({});
    }

    const result = await FAQ.insertMany(toInsert);

    return res.json({
      message: `${result.length} FAQ(s) imported successfully (mode: ${mode})`,
      count: result.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to import FAQs' });
  }
});

// GET /api/admin/faq/export — export all FAQs as CSV
faqRouter.get('/admin/export', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const faqs = await FAQ.find().sort({ displayOrder: 1 }).lean();

    const header = 'question,answer,isPublished';
    const rows = faqs.map((f) => {
      const esc = (v: string | undefined) => {
        if (!v) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      return [esc(f.question), esc(f.answer), esc(f.isPublished ? 'true' : 'false')].join(',');
    });

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="faqs.csv"');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to export FAQs' });
  }
});
