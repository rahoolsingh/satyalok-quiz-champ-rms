"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPendingPaymentReminders = sendPendingPaymentReminders;
exports.startPaymentReminderScheduler = startPaymentReminderScheduler;
const models_1 = require("../db/models");
const whatsapp_1 = require("./whatsapp");
/**
 * Payment Reminder Service
 * Sends reminders to participants with pending payments
 */
const REMINDER_DELAY_HOURS = 24; // Send reminder after 24 hours of pending payment
/**
 * Check for pending payments and send reminders (only once per participant)
 */
async function sendPendingPaymentReminders() {
    try {
        console.log('[Payment Reminder] Checking for pending payments...');
        const cutoffTime = new Date(Date.now() - REMINDER_DELAY_HOURS * 60 * 60 * 1000);
        // Find participants with pending payments who haven't received a reminder yet
        const pendingParticipants = await models_1.Participant.find({
            paymentStatus: 'PENDING',
            paymentReminderSent: { $ne: true },
            createdAt: { $lt: cutoffTime },
            merchantTransactionId: { $exists: true, $ne: null },
        });
        console.log(`[Payment Reminder] Found ${pendingParticipants.length} participants needing reminders`);
        for (const participant of pendingParticipants) {
            try {
                const paymentUrl = `${process.env.FRONTEND_URL}/payment-status?participantId=${participant._id}`;
                // Calculate amount based on batch type (fallback values)
                const amount = participant.batchType === 'JUNIOR' ? 100 : 150;
                await (0, whatsapp_1.sendPaymentReminder)(participant.mobileNumber, {
                    name: participant.name,
                    amount,
                    paymentUrl,
                });
                // Mark reminder as sent
                participant.paymentReminderSent = true;
                await participant.save();
                console.log(`[Payment Reminder] Reminder sent to ${participant.name} (${participant.mobileNumber})`);
            }
            catch (error) {
                console.error(`[Payment Reminder] Failed to send reminder to ${participant.name}:`, error);
                // Continue with next participant even if one fails
            }
        }
        console.log('[Payment Reminder] Reminder check completed');
    }
    catch (error) {
        console.error('[Payment Reminder] Error in reminder service:', error);
    }
}
/**
 * Start the payment reminder scheduler
 * Runs every hour to check for pending payments
 */
function startPaymentReminderScheduler() {
    const INTERVAL_MS = 60 * 60 * 1000; // 1 hour
    console.log('[Payment Reminder] Scheduler started (runs every hour)');
    // Run immediately on startup
    sendPendingPaymentReminders();
    // Then run every hour
    setInterval(() => {
        sendPendingPaymentReminders();
    }, INTERVAL_MS);
}
//# sourceMappingURL=paymentReminder.js.map