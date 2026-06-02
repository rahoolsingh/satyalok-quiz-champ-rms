import { Router, Request, Response } from 'express';
import { Participant, PortalConfig } from '../db/models';
import { generateAdmitCardPDF } from '../services/admitCardPdf';
import { sendAdmitCardPdfDirect } from '../services/whatsapp';

export const whatsappWebhookRouter = Router();

// GET /api/whatsapp/webhook — Meta verification handshake
whatsappWebhookRouter.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST /api/whatsapp/webhook — Incoming messages from Meta
whatsappWebhookRouter.post('/webhook', async (req: Request, res: Response) => {
  // Acknowledge immediately — Meta requires fast response
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Only process actual incoming messages (not status updates)
    const message = value?.messages?.[0];
    if (!message) return;

    // Extract the sender's number (Meta sends as "91XXXXXXXXXX")
    const from: string = message.from; // e.g. "919876543210"
    const mobileNumber = from.startsWith('91') ? from.slice(2) : from;

    console.log(`[WhatsApp Webhook] Incoming message from ${mobileNumber}`);

    // Find participant who was sent the admit card template
    const participant = await Participant.findOne({
      mobileNumber,
      paymentStatus: 'COMPLETED',
      rollNumber: { $exists: true, $ne: null },
      admitCardWhatsappSentAt: { $exists: true },
    });

    if (!participant) {
      console.log(`[WhatsApp Webhook] No admit-card participant found for ${mobileNumber}`);
      return;
    }

    // Generate and send PDF directly (we're now inside the 24h window)
    const portalConfig = await PortalConfig.findOne().lean();
    const examDate = portalConfig?.eventDate
      ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
      : 'To be announced';

    const pdfBuffer = await generateAdmitCardPDF({
      rollNumber: participant.rollNumber!,
      name: participant.name,
      class: participant.class,
      batchType: participant.batchType,
      guardianName: participant.guardianName,
      mobileNumber: participant.mobileNumber,
      photoUrl: participant.photoUrl,
      eventName: 'Quiz Champ 2026',
      eventDate: portalConfig?.eventDate
        ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
        : undefined,
      eventTime: portalConfig?.eventTime,
      reportingTime: portalConfig?.reportingTime,
      examTime: portalConfig?.examTime,
      venue: portalConfig?.venue,
      venueMapUrl: portalConfig?.venueMapUrl,
      participantId: participant._id.toString(),
      questionPaperLanguage: participant.questionPaperLanguage,
    });

    await sendAdmitCardPdfDirect(
      participant.mobileNumber,
      pdfBuffer,
      `AdmitCard_${participant.rollNumber}`,
      {
        name: participant.name,
        rollNumber: participant.rollNumber!,
        batchType: participant.batchType,
        examDate,
      }
    );

    console.log(`[WhatsApp Webhook] ✅ PDF sent directly to ${participant.name} after reply`);
  } catch (err) {
    console.error('[WhatsApp Webhook] Error processing message:', err);
  }
});
