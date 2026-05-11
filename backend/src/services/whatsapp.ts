import axios from 'axios';

/**
 * WhatsApp Service for sending OTP and notifications
 * Supports both WhatsApp Business API and mock mode for development
 */

export interface ThankYouMessageData {
  name: string;
  rollNumber: string;
  admitCardUrl: string;
  eventDate: string;
  contactInfo: string;
}

export interface ReminderData {
  name: string;
  amount: number;
  paymentUrl: string;
}

/**
 * Sends OTP via WhatsApp
 */
export async function sendWhatsAppOTP(mobileNumber: string, otp: string): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WHATSAPP] OTP ${otp} → ${mobileNumber}`);
    return;
  }

  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiKey = process.env.WHATSAPP_API_KEY;

  if (!whatsappApiUrl) throw new Error('WHATSAPP_API_URL is not set');
  if (!whatsappApiKey) throw new Error('WHATSAPP_API_KEY is not set');

  const message = otpTemplate(otp);

  console.log(`[WhatsApp] Sending OTP to ${mobileNumber}`);

  try {
    const response = await axios.post(
      whatsappApiUrl,
      {
        phone: `91${mobileNumber}`,
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': whatsappApiKey,
        },
        timeout: 10000,
      }
    );

    console.log('[WhatsApp] OTP sent successfully:', response.data);
  } catch (error) {
    console.error('[WhatsApp] Failed to send OTP:', error);
    throw new Error('Failed to send OTP via WhatsApp');
  }
}

/**
 * Sends thank you message after successful payment
 */
export async function sendThankYouMessage(
  mobileNumber: string,
  data: ThankYouMessageData
): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WHATSAPP] Thank you message → ${mobileNumber}`, data);
    return;
  }

  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiKey = process.env.WHATSAPP_API_KEY;

  if (!whatsappApiUrl) throw new Error('WHATSAPP_API_URL is not set');
  if (!whatsappApiKey) throw new Error('WHATSAPP_API_KEY is not set');

  const message = thankYouTemplate(data);

  console.log(`[WhatsApp] Sending thank you message to ${mobileNumber}`);

  try {
    const response = await axios.post(
      whatsappApiUrl,
      {
        phone: `91${mobileNumber}`,
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': whatsappApiKey,
        },
        timeout: 10000,
      }
    );

    console.log('[WhatsApp] Thank you message sent successfully:', response.data);
  } catch (error) {
    console.error('[WhatsApp] Failed to send thank you message:', error);
    throw new Error('Failed to send thank you message via WhatsApp');
  }
}

/**
 * Sends payment reminder
 */
export async function sendPaymentReminder(
  mobileNumber: string,
  data: ReminderData
): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WHATSAPP] Payment reminder → ${mobileNumber}`, data);
    return;
  }

  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiKey = process.env.WHATSAPP_API_KEY;

  if (!whatsappApiUrl) throw new Error('WHATSAPP_API_URL is not set');
  if (!whatsappApiKey) throw new Error('WHATSAPP_API_KEY is not set');

  const message = paymentReminderTemplate(data);

  console.log(`[WhatsApp] Sending payment reminder to ${mobileNumber}`);

  try {
    const response = await axios.post(
      whatsappApiUrl,
      {
        phone: `91${mobileNumber}`,
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': whatsappApiKey,
        },
        timeout: 10000,
      }
    );

    console.log('[WhatsApp] Payment reminder sent successfully:', response.data);
  } catch (error) {
    console.error('[WhatsApp] Failed to send payment reminder:', error);
    // Don't throw error for reminders - just log it
  }
}

// ─── Message Templates ────────────────────────────────────────────────────────

function otpTemplate(otp: string): string {
  return `🎓 *Quiz Champ 2026*

Your OTP for registration is: *${otp}*

⏰ Valid for 5 minutes
🔒 Do not share this code with anyone

Need help? Contact us at support@quizchamp.com`;
}

function thankYouTemplate(data: ThankYouMessageData): string {
  return `🎉 *Registration Successful!*

Dear ${data.name},

Thank you for registering for Quiz Champ 2026! 

📋 *Your Details:*
Roll Number: *${data.rollNumber}*
Event Date: ${data.eventDate}

📥 *Download Admit Card:*
${data.admitCardUrl}

📌 *Important Instructions:*
• Bring your admit card on the event day
• Arrive 30 minutes before the scheduled time
• Carry a valid ID proof

${data.contactInfo}

Best wishes for the competition! 🏆`;
}

function paymentReminderTemplate(data: ReminderData): string {
  return `📢 *Payment Pending*

Dear ${data.name},

Your Quiz Champ 2026 registration is incomplete.

💰 Amount: ₹${data.amount}
🔗 Complete Payment: ${data.paymentUrl}

Complete your payment to secure your spot!

Need help? Contact us at support@quizchamp.com`;
}
