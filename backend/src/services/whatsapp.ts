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
  amount: number;
}

export interface ReminderData {
  name: string;
  amount: number;
  paymentUrl: string;
  batchType: string;
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
    text: { preview_url: true, body: message },
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
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: otp }],
    },
  ]);
}


/**
 * Sends payment confirmation after successful payment
 * Template: quizchamppaymentdone (en_US, UTILITY)
 * Body: Hi {{1}}, We have received your payment of {{2}} for {{3}}.
 * Button: Static URL (no parameter needed)
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

  await sendMetaTemplate(mobileNumber, 'quizchamppaymentdone', 'en_US', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.name },
        { type: 'text', text: `₹${data.amount}` },
        { type: 'text', text: 'Quiz Champ 2026 Registration' },
      ],
    },
  ]);
}

/**
 * Sends payment reminder
 * Template: quizchamppaymentreminder (en, UTILITY)
 * Header: "Registration Pending"
 * Body: Hi {{1}}, your Quiz Champ 2026 registration payment of {{2}} for {{3}} is pending.
 * Button: Static URL
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

  const batchLabel = data.batchType === 'JUNIOR' ? 'Junior Batch' : 'Senior Batch';

  await sendMetaTemplate(mobileNumber, 'quizchamppaymentreminder', 'en', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.name },
        { type: 'text', text: `Rs.${data.amount}` },
        { type: 'text', text: batchLabel },
      ],
    },
  ]);
}

/**
 * Sends group join link — directs user to a tracking page that opens the WhatsApp group
 * The link includes the participant's ID to track who joined
 */
export async function sendGroupInvite(mobileNumber: string, participantId?: string): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WhatsApp] Group invite → ${mobileNumber}`);
    return;
  }

  const portalUrl = process.env.FRONTEND_URL || 'https://quizchamp.satyalok.in';
  const groupJoinUrl = participantId
    ? `${portalUrl}/group-join?uid=${participantId}`
    : portalUrl;

  const message = `🎓 *Quiz Champ 2026*

Join our official WhatsApp group for event updates and announcements:

👉 ${groupJoinUrl}`;

  await sendMetaTextMessage(mobileNumber, message);
}

/**
 * Sends admit card download reminder
 * Template: quizchampadmitcardreminder (en, MARKETING)
 * Header: "Download Your Hall Ticket"
 * Body: Hi {{1}}, ... Roll Number: {{2}}, Group: {{3}}, Date of Event: {{4}}
 * Button: Static URL
 */
export interface AdmitCardReminderData {
  name: string;
  rollNumber: string;
  batchType: string;
  eventDate: string;
}

export async function sendAdmitCardReminder(
  mobileNumber: string,
  data: AdmitCardReminderData
): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'mock') {
    console.log(`[MOCK WhatsApp] Admit card reminder → ${mobileNumber}`);
    return;
  }

  const groupLabel = data.batchType === 'JUNIOR' ? 'Junior' : 'Senior';

  await sendMetaTemplate(mobileNumber, 'quizchampadmitcardreminder', 'en', [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.name },
        { type: 'text', text: data.rollNumber },
        { type: 'text', text: groupLabel },
        { type: 'text', text: data.eventDate },
      ],
    },
  ]);
}
