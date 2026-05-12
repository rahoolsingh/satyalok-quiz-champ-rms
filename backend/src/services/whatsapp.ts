import axios from 'axios';

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
 * Sends message via WhatsApp API
 */
async function sendWhatsApp(mobileNumber: string, message: string): Promise<void> {
  const whatsappProvider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (whatsappProvider === 'mock') {
    console.log(`[MOCK WHATSAPP] Message → ${mobileNumber}`);
    console.log(`[MOCK WHATSAPP] Content: ${message}`);
    return;
  }

  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiKey = process.env.WHATSAPP_API_KEY;

  if (!whatsappApiUrl) throw new Error('WHATSAPP_API_URL is not set');
  if (!whatsappApiKey) throw new Error('WHATSAPP_API_KEY is not set');

  console.log(`[WhatsApp] Sending message to ${mobileNumber}`);

  const response = await axios.post(
    whatsappApiUrl,
    {
      mobileNumber: `91${mobileNumber}`,
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

  console.log('[WhatsApp] Message sent successfully:', response.data);
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
}

/**
 * Sends message via WhatsApp with SMS fallback
 */
async function sendMessageWithFallback(mobileNumber: string, message: string): Promise<void> {
  try {
    // Try WhatsApp first
    await sendWhatsApp(mobileNumber, message);
    console.log(`[Message] Successfully sent via WhatsApp to ${mobileNumber}`);
  } catch (whatsappError) {
    console.error('[Message] WhatsApp delivery failed, attempting SMS fallback:', whatsappError);
    
    try {
      // Fallback to SMS
      await sendSMS(mobileNumber, message);
      console.log(`[Message] Successfully sent via SMS fallback to ${mobileNumber}`);
    } catch (smsError) {
      console.error('[Message] SMS fallback also failed:', smsError);
      throw new Error('Failed to send message via both WhatsApp and SMS');
    }
  }
}

/**
 * Sends OTP via WhatsApp with SMS fallback
 */
export async function sendWhatsAppOTP(mobileNumber: string, otp: string): Promise<void> {
  const message = otpTemplate(otp);
  await sendMessageWithFallback(mobileNumber, message);
}

/**
 * Sends thank you message after successful payment via WhatsApp with SMS fallback
 */
export async function sendThankYouMessage(
  mobileNumber: string,
  data: ThankYouMessageData
): Promise<void> {
  const message = thankYouTemplate(data);
  await sendMessageWithFallback(mobileNumber, message);
}

/**
 * Sends payment reminder via WhatsApp with SMS fallback
 */
export async function sendPaymentReminder(
  mobileNumber: string,
  data: ReminderData
): Promise<void> {
  const message = paymentReminderTemplate(data);
  await sendMessageWithFallback(mobileNumber, message);
}

/**
 * Sends WhatsApp group invite link via WhatsApp with SMS fallback
 */
export async function sendGroupInvite(mobileNumber: string): Promise<void> {
  const whatsappGroupUrl = 'https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc';
  const message = `Join this group: ${whatsappGroupUrl}`;
  await sendMessageWithFallback(mobileNumber, message);
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
}

function thankYouTemplate(data: ThankYouMessageData): string {
  const whatsappGroupUrl = 'https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc';
  const contactNumber = '+916207782702';
  
  return `🎉 *Registration Successful!*

Dear *${data.name}*,

Thank you for registering for Quiz Champ 2026! 

📋 *Your Details:*
Roll Number: *${data.rollNumber}*

📅 *Event Details:*
Date: ${data.eventDate}
Time: ${data.eventTime}
Venue: ${data.venue}

📥 *Download Admit Card:*
quizchamp.satyalok.in

� *Join WhnatsApp Group:*
${whatsappGroupUrl}

📌 *Important Instructions:*
• Bring your admit card on event day
• Arrive 30 minutes before scheduled time
• Carry a valid ID proof
• Join our WhatsApp group for updates

📞 *Need Help?*
Contact: ${contactNumber}
Email: contact@satyalok.in

Best wishes for the competition! 🏆`;
}

function paymentReminderTemplate(data: ReminderData): string {
  return `📢 *Payment Pending*

Dear ${data.name},

Your Quiz Champ 2026 registration is incomplete.

💰 Amount: ₹${data.amount}
🔗 Complete Payment: quizchamp.satyalok.in

Complete your payment to secure your spot!

Need help? Contact us at contact@satyalok.in`;
}
