import axios from 'axios';

/**
 * WhatsApp Service using Meta Cloud API
 * Sends messages via official WhatsApp Business Platform
 */

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

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
 * Returns Meta API config from environment
 */
function getMetaConfig() {
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId) throw new Error('META_WHATSAPP_PHONE_NUMBER_ID is not set');
  if (!accessToken) throw new Error('META_WHATSAPP_ACCESS_TOKEN is not set');

  return { phoneNumberId, accessToken };
}

/**
 * Sends a template message via Meta WhatsApp Cloud API
 */
async function sendMetaTemplate(
  mobileNumber: string,
  templateName: string,
  languageCode: string,
  components: any[]
): Promise<void> {
  const { phoneNumberId, accessToken } = getMetaConfig();

  const url = `${META_API_BASE}/${phoneNumberId}/messages`;

  const payload: any = {
    messaging_product: 'whatsapp',
    to: `91${mobileNumber}`,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };

  if (components.length > 0) {
    payload.template.components = components;
  }

  console.log(`[Meta WhatsApp] Sending template "${templateName}" to 91${mobileNumber}`);
  console.log(`[Meta WhatsApp] Payload:`, JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    console.log('[Meta WhatsApp] Response:', JSON.stringify(response.data));
  } catch (error: any) {
    if (error.response) {
      console.error('[Meta WhatsApp] API Error:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

/**
 * Sends a free-form text message via Meta WhatsApp Cloud API
 * Note: Only works within 24-hour customer service window
 */
async function sendMetaTextMessage(mobileNumber: string, message: string): Promise<void> {
  const { phoneNumberId, accessToken } = getMetaConfig();

  const url = `${META_API_BASE}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: `91${mobileNumber}`,
    type: 'text',
    text: { body: message },
  };

  console.log(`[Meta WhatsApp] Sending text message to 91${mobileNumber}`);

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  console.log('[Meta WhatsApp] Response:', JSON.stringify(response.data));
}

/**
 * Sends OTP via Meta WhatsApp template
 * Template: quizchampverification
 * Structure: {{1}} is your verification code. For your security, do not share this code.
 */
export async function sendWhatsAppOTP(mobileNumber: string, otp: string): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WhatsApp] OTP ${otp} → ${mobileNumber}`);
    return;
  }

  await sendMetaTemplate(mobileNumber, 'quizchampverification', 'en', [
    {
      type: 'body',
      parameters: [{ type: 'text', text: otp }],
    },
  ]);
}


/**
 * Sends thank you message after successful payment
 * Uses free-form text (within 24h window) since user just interacted
 */
export async function sendThankYouMessage(
  mobileNumber: string,
  data: ThankYouMessageData
): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WhatsApp] Thank you message → ${mobileNumber}`);
    return;
  }

  const message = `🎉 *Registration Successful!*

Dear *${data.name}*,

Thank you for registering for Quiz Champ 2026!

📋 *Your Details:*
Roll Number: *${data.rollNumber}*

📅 *Event Details:*
Date: ${data.eventDate}
Time: ${data.eventTime}
Venue: ${data.venue}

📥 *Download Admit Card:*
${data.portalUrl}

📌 *Important Instructions:*
• Bring your admit card on event day
• Arrive 30 minutes before scheduled time
• Carry a valid ID proof

📞 *Need Help?*
Contact: +916207782702

Best wishes for the competition! 🏆`;

  await sendMetaTextMessage(mobileNumber, message);
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
    console.log(`[MOCK WhatsApp] Payment reminder → ${mobileNumber}`);
    return;
  }

  const message = `📢 *Payment Pending*

Dear ${data.name},

Your Quiz Champ 2026 registration is incomplete.

💰 Amount: ₹${data.amount}
🔗 Complete Payment: ${data.paymentUrl}

Complete your payment to secure your spot!

Need help? Contact us at contact@satyalok.in`;

  await sendMetaTextMessage(mobileNumber, message);
}

/**
 * Sends WhatsApp group invite link
 */
export async function sendGroupInvite(mobileNumber: string): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WhatsApp] Group invite → ${mobileNumber}`);
    return;
  }

  const whatsappGroupUrl = 'https://chat.whatsapp.com/KNDhPH2OIUvIUrofJ3xMtc';
  const message = `🎓 *Quiz Champ 2026*\n\nJoin our official WhatsApp group for updates:\n${whatsappGroupUrl}`;

  await sendMetaTextMessage(mobileNumber, message);
}

/**
 * Sends admit card download reminder
 */
export async function sendAdmitCardReminder(mobileNumber: string, name: string): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WhatsApp] Admit card reminder → ${mobileNumber}`);
    return;
  }

  const portalUrl = process.env.FRONTEND_URL || 'https://quizchamp.satyalok.in';
  const message = `Hi ${name}, please download your Quiz Champ 2026 admit card from ${portalUrl}. You will need it on the event day.`;

  await sendMetaTextMessage(mobileNumber, message);
}
