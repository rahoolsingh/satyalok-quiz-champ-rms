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

    const resultsAgg = await Result.aggregate([
      {
        $lookup: {
          from: 'participants',
          localField: 'participantId',
          foreignField: '_id',
          as: 'participantData',
        },
      },
      { $unwind: '$participantData' },
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
          partitionBy: '$participantData.batchType',
          sortBy: { compositeScore: -1 },
          output: {
            calculatedRank: { $denseRank: {} },
          },
        },
      },
      {
        $match: {
          rollNumber: rollNumber
        }
      }
    ]);

    const resultDoc = resultsAgg[0];
    if (!resultDoc) {
      return res.status(404).json({ error: 'No result found for this roll number.' });
    }

    return res.json({
      rollNumber: resultDoc.rollNumber,
      name: resultDoc.participantData?.name,
      class: resultDoc.participantData?.class,
      batchType: resultDoc.participantData?.batchType,
      score: resultDoc.score,
      positiveMarks: resultDoc.positiveMarks,
      negativeMarks: resultDoc.negativeMarks,
      rank: resultDoc.calculatedRank ?? resultDoc.rank,
      remarks: resultDoc.remarks,
      publishedAt: resultDoc.publishedAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve result' });
  }
});
