/**
 * Check for pending payments and send reminders (only once per participant)
 */
export declare function sendPendingPaymentReminders(): Promise<void>;
/**
 * Start the payment reminder scheduler
 * Runs every hour to check for pending payments
 */
export declare function startPaymentReminderScheduler(): void;
//# sourceMappingURL=paymentReminder.d.ts.map