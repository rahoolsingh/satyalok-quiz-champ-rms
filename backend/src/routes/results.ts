import { Router, Request, Response } from 'express';
import { Result, Participant } from '../db/models';
import { getPortalConfig, areResultsPublished } from '../services/portalState';
import { isValidRollNumber } from '../services/rollNumber';

export const resultsRouter = Router();

// GET /api/results/:rollNumber
resultsRouter.get('/:rollNumber', async (req: Request, res: Response) => {
  try {
    const { rollNumber } = req.params;

    if (!isValidRollNumber(rollNumber)) {
      return res.status(400).json({ error: 'Invalid roll number format. Must be 5 digits.' });
    }

    const config = await getPortalConfig();
    if (!config || !areResultsPublished(config)) {
      return res.status(403).json({ error: 'Results have not been published yet. Please check back later.' });
    }

    const result = await Result.findOne({ rollNumber }).populate<{
      participantId: { name: string; class: string; batchType: string };
    }>('participantId', 'name class batchType');

    if (!result) {
      return res.status(404).json({ error: 'No result found for this roll number.' });
    }

    const p = result.participantId as unknown as { name: string; class: string; batchType: string };

    return res.json({
      rollNumber: result.rollNumber,
      name: p.name,
      class: p.class,
      batchType: p.batchType,
      score: result.score,
      rank: result.rank,
      remarks: result.remarks,
      publishedAt: result.publishedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve result' });
  }
});
