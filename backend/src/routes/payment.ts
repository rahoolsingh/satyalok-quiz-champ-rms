import { Router, Request, Response } from 'express';
import { Participant } from '../db/models';
import { verifyPhonePePayment } from '../services/pgsClient';
import { generateUniqueRollNumber } from '../services/rollNumber';

export const paymentRouter = Router();

/**
 * GET /api/payment/callback?id={merchantTransactionId}
 *
 * Called by the PGS after PhonePe completes a payment.
 * Verifies the payment status, updates the participant record,
 * then redirects the browser to the appropriate frontend page.
 */
paymentRouter.get('/callback', async (req: Request, res: Response) => {
  const merchantTransactionId = req.query.id as string | undefined;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (!merchantTransactionId) {
    return res.status(400).json({ error: 'Transaction ID is required' });
  }

  // Look up participant by merchantTransactionId
  const participant = await Participant.findOne({ merchantTransactionId });
  if (!participant) {
    console.warn(`[payment/callback] Participant not found for txn: ${merchantTransactionId}`);
    return res.status(404).json({ error: 'Participant not found for this transaction' });
  }

  // Idempotency: already processed
  if (participant.paymentStatus === 'COMPLETED') {
    return res.redirect(`${frontendUrl}/payment-success?participantId=${participant._id.toString()}`);
  }

  // Verify with PGS
  let statusResponse;
  try {
    statusResponse = await verifyPhonePePayment(merchantTransactionId);
  } catch (err) {
    console.error('[payment/callback] PGS status check failed:', err);
    return res.status(502).json({ error: 'Payment status check failed. Please contact support.' });
  }

  if (statusResponse.success) {
    // Assign roll number and mark COMPLETED
    let rollNumber: string;
    try {
      rollNumber = await generateUniqueRollNumber();
    } catch (err) {
      console.error('[payment/callback] Roll number generation failed:', err);
      return res.status(500).json({ error: 'Failed to assign roll number' });
    }

    await Participant.findByIdAndUpdate(participant._id, {
      paymentStatus: 'COMPLETED',
      paymentId: statusResponse.data?.transactionId || merchantTransactionId,
      rollNumber,
    });

    return res.redirect(
      `${frontendUrl}/payment-success?participantId=${participant._id.toString()}`
    );
  } else {
    await Participant.findByIdAndUpdate(participant._id, {
      paymentStatus: 'FAILED',
    });

    return res.redirect(`${frontendUrl}/payment-failed`);
  }
});
