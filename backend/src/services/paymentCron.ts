import { PaymentAttempt } from '../db/models';
import { verifyPaymentStatus, processPaymentVerification } from './paymentVerification';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes
const MAX_AGE_HOURS = 48; // Only check attempts from last 48 hours

/**
 * Checks all pending/initiated payment attempts with the gateway
 * and processes any that have been completed.
 */
async function checkPendingPayments(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

    // Find all unresolved payment attempts from the last 48 hours
    const pendingAttempts = await PaymentAttempt.find({
      status: { $in: ['INITIATED', 'PENDING'] },
      createdAt: { $gte: cutoff },
    }).sort({ createdAt: -1 });

    if (pendingAttempts.length === 0) return;

    console.log(`[Payment Cron] Checking ${pendingAttempts.length} pending payment(s)...`);

    for (const attempt of pendingAttempts) {
      try {
        const result = await verifyPaymentStatus(attempt.merchantTransactionId);

        if (result.status === 'SUCCESS') {
          // Update attempt record
          attempt.status = 'SUCCESS';
          attempt.verifiedAt = new Date();
          attempt.gatewayResponse = JSON.stringify(result);
          await attempt.save();

          // Process the full verification flow
          await processPaymentVerification(attempt.merchantTransactionId);
          console.log(`[Payment Cron] ✅ Payment SUCCESS for ${attempt.merchantTransactionId} (${attempt.mobileNumber})`);
        } else if (result.status === 'FAILED') {
          attempt.status = 'FAILED';
          attempt.verifiedAt = new Date();
          attempt.gatewayResponse = JSON.stringify(result);
          await attempt.save();
          console.log(`[Payment Cron] ❌ Payment FAILED for ${attempt.merchantTransactionId}`);
        }
        // If still PENDING, leave it for next check
      } catch (err) {
        console.error(`[Payment Cron] Error checking ${attempt.merchantTransactionId}:`, err);
      }

      // Small delay between checks to avoid hammering the gateway
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (err) {
    console.error('[Payment Cron] Error:', err);
  }
}

/**
 * Starts the payment verification cron job
 */
export function startPaymentCron(): void {
  console.log(`[Payment Cron] Started (checks every ${CHECK_INTERVAL_MS / 1000}s)`);

  // Run immediately on startup
  checkPendingPayments();

  // Then run periodically
  setInterval(checkPendingPayments, CHECK_INTERVAL_MS);
}
