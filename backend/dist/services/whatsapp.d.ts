/**
 * SMS/WhatsApp Service for sending OTP and notifications
 * Tries WhatsApp first, falls back to SMS if WhatsApp fails
 */
export interface ThankYouMessageData {
    name: string;
    rollNumber: string;
    admitCardUrl: string;
    portalUrl: string;
    eventDate: string;
    eventTime: string;
    venue: string;
}
export interface ReminderData {
    name: string;
    amount: number;
    paymentUrl: string;
}
/**
 * Sends OTP via WhatsApp with SMS fallback
 */
export declare function sendWhatsAppOTP(mobileNumber: string, otp: string): Promise<void>;
/**
 * Sends thank you message after successful payment via WhatsApp with SMS fallback
 */
export declare function sendThankYouMessage(mobileNumber: string, data: ThankYouMessageData): Promise<void>;
/**
 * Sends payment reminder via WhatsApp with SMS fallback
 */
export declare function sendPaymentReminder(mobileNumber: string, data: ReminderData): Promise<void>;
/**
 * Sends WhatsApp group invite link via WhatsApp with SMS fallback
 */
export declare function sendGroupInvite(mobileNumber: string): Promise<void>;
/**
 * Sends admit card download reminder via WhatsApp with SMS fallback
 */
export declare function sendAdmitCardReminder(mobileNumber: string, name: string): Promise<void>;
//# sourceMappingURL=whatsapp.d.ts.map