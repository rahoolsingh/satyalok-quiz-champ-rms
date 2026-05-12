import axios from 'axios';

/**
 * SMS/WhatsApp Service for sending OTP and notifications
 * Uses SMS API for all messages
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
 * Sends SMS using the configured SMS API
 */
async function sendSMS(mobileNumber: string, message: string): Promise<void> {
  const smsProvider = process.env.SMS_PROVIDER || 'mock';

  if (smsProvider === 'mock') {
    console.log(`[MOCK SMS] Message → ${mobileNumber}`);
    console.log(`[MOCK SMS] Content: ${message}`);
    return;
  }

  const smsApiUrl = process.env.SMS_API_URL;
  const smsApiKey = process.env.SMS_API_KEY;

  if (!smsApiUrl) throw new Error('SMS_API_URL is not set');
  if (!smsApiKey) throw new Error('SMS_API_KEY is not set');

  console.log(`[SMS] Sending message to ${mobileNumber}`);

  try {
    const response = await axios.post(
      smsApiUrl,
      {
        mobileNumber: `91${mobileNumber}`,
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': smsApiKey,
        },
        timeout: 10000,
      }
    );

    console.log('[SMS] Message sent successfully:', response.data);
  } catch (error) {
    console.error('[SMS] Failed to send message:', error);
    throw new Error('Failed to send SMS');
  }
}

/**
 * Sends OTP via SMS
 */
export async function sendWhatsAppOTP(mobileNumber: string, otp: string): Promise<void> {
  const message = otpTemplate(otp);
  await sendSMS(mobileNumber, message);
}

/**
 * Sends thank you message after successful payment via SMS
 */
export async function sendThankYouMessage(
  mobileNumber: string,
  data: ThankYouMessageData
): Promise<void> {
  const message = thankYouTemplate(data);
  await sendSMS(mobileNumber, message);
}

/**
 * Sends payment reminder via SMS
 */
export async function sendPaymentReminder(
  mobileNumber: string,
  data: ReminderData
): Promise<void> {
  try {
    const message = paymentReminderTemplate(data);
    await sendSMS(mobileNumber, message);
  } catch (error) {
    console.error('[SMS] Failed to send payment reminder:', error);
    // Don't throw error for reminders - just log it
  }
}

// ─── Message Templates ────────────────────────────────────────────────────────

function otpTemplate(otp: string): string {
  return `🎓 *Quiz Champ 2026*

Your OTP for registration is: *${otp}*

⏰ Valid for 5 minutes
🔒 Do not share this code with anyone

Need help? Contact us at 
Subodh: +916207782702

For more info, visit: www.satyalok.in`;
`;
}

function thankYouTemplate(data: ThankYouMessageData): string {
  const portalUrl = process.env.FRONTEND_URL || 'https://satyalok.in';
  const whatsappGroupUrl = 'https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc';
  
  return `🎉 *Registration Successful!*

Dear ${data.name},

Thank you for registering for Quiz Champ 2026! 

📋 *Your Details:*
Roll Number: *${data.rollNumber}*
Event Date: ${data.eventDate}

📥 *Download Admit Card:*
${data.admitCardUrl}

🌐 *Portal Access:*
Login anytime at: ${portalUrl}

📱 *Join WhatsApp Group:*
Stay updated with quiz information:
${whatsappGroupUrl}

📌 *Important Instructions:*
• Bring your admit card on the event day
• Arrive 30 minutes before the scheduled time
• Carry a valid ID proof
• Join our WhatsApp group for updates

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

Need help? Contact us at contact@satyalok.in`;
}
