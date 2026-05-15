"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const models_1 = require("../db/models");
const paymentVerification_1 = require("../services/paymentVerification");
exports.paymentRouter = (0, express_1.Router)();
/**
 * GET /api/payment/callback?id={merchantTransactionId}
 *
 * Called by the PGS after PhonePe completes a payment.
 * Verifies the payment status with the gateway, updates the participant record,
 * sends WhatsApp and email notifications, then redirects to the frontend.
 */
exports.paymentRouter.get('/callback', async (req, res) => {
    const merchantTransactionId = req.query.id;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!merchantTransactionId) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }
    // Look up participant by merchantTransactionId
    const participant = await models_1.Participant.findOne({ merchantTransactionId });
    if (!participant) {
        console.warn(`[payment/callback] Participant not found for txn: ${merchantTransactionId}`);
        return res.status(404).json({ error: 'Participant not found for this transaction' });
    }
    // Idempotency: already processed
    if (participant.paymentStatus === 'COMPLETED') {
        return res.redirect(`${frontendUrl}/payment-status?participantId=${participant._id.toString()}`);
    }
    try {
        // Process payment verification (verifies with gateway, updates status, sends notifications)
        await (0, paymentVerification_1.processPaymentVerification)(merchantTransactionId);
        // Fetch updated participant to check final status
        const updatedParticipant = await models_1.Participant.findById(participant._id);
        if (updatedParticipant?.paymentStatus === 'COMPLETED') {
            return res.redirect(`${frontendUrl}/payment-status?participantId=${participant._id.toString()}`);
        }
        else if (updatedParticipant?.paymentStatus === 'FAILED') {
            return res.redirect(`${frontendUrl}/payment-status?txnId=${merchantTransactionId}`);
        }
        else {
            // Payment status is still PENDING - schedule background verification
            await (0, paymentVerification_1.scheduleVerificationJob)(merchantTransactionId, 0);
            // Redirect to status page which will show checking state
            return res.redirect(`${frontendUrl}/payment-status?participantId=${participant._id.toString()}&pending=true`);
        }
    }
    catch (error) {
        console.error('[payment/callback] Error processing payment:', error);
        // Schedule background verification as fallback
        await (0, paymentVerification_1.scheduleVerificationJob)(merchantTransactionId, 0);
        return res.status(500).json({
            error: 'Payment processing error. Your payment will be verified shortly.'
        });
    }
});
//# sourceMappingURL=payment.js.map