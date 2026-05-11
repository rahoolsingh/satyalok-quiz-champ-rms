import { Router, Request, Response } from 'express';
import { Participant } from '../db/models';
import { processPaymentVerification, scheduleVerificationJob } from '../services/paymentVerification';

export const paymentRouter = Router();

/**
 * GET /api/payment/callback?id={merchantTransactionId}
 *
 * Called by the PGS after PhonePe completes a payment.
 * Verifies the payment status with the gateway, updates the participant record,
 * sends WhatsApp and email notifications, then redirects to the frontend.
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

  try {
    // Process payment verification (verifies with gateway, updates status, sends notifications)
    await processPaymentVerification(merchantTransactionId);

    // Fetch updated participant to check final status
    const updatedParticipant = await Participant.findById(participant._id);

    if (updatedParticipant?.paymentStatus === 'COMPLETED') {
      return res.redirect(
        `${frontendUrl}/payment-success?participantId=${participant._id.toString()}`
      );
    } else if (updatedParticipant?.paymentStatus === 'FAILED') {
      return res.redirect(`${frontendUrl}/payment-failed`);
    } else {
      // Payment status is still PENDING - schedule background verification
      await scheduleVerificationJob(merchantTransactionId, 0);
      
      // Redirect to a pending page or success page with a message
      return res.redirect(
        `${frontendUrl}/payment-success?participantId=${participant._id.toString()}&pending=true`
      );
    }
  } catch (error) {
    console.error('[payment/callback] Error processing payment:', error);
    
    // Schedule background verification as fallback
    await scheduleVerificationJob(merchantTransactionId, 0);
    
    return res.status(500).json({ 
      error: 'Payment processing error. Your payment will be verified shortly.' 
    });
  }
});
