import { Router, Request, Response } from 'express';
import { Faq } from '../db/models';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const faqRouter = Router();

// GET /api/faq — public, returns published FAQs
faqRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const faqs = await Faq.find({ isPublished: true })
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
    const faqs = await Faq.find().sort({ displayOrder: 1 }).lean();
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

    const maxDoc = await Faq.findOne().sort({ displayOrder: -1 });
    const nextOrder = displayOrder ?? (maxDoc ? maxDoc.displayOrder + 1 : 0);

    const faq = await Faq.create({
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

    const faq = await Faq.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    return res.json({ message: 'FAQ deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});
