import { Participant, PortalConfig } from '../db/models';
import { generateAdmitCardPDF, AdmitCardData } from './admitCardPdf';
import { sendAdmitCardWhatsApp } from './whatsapp';

interface QueueStatus {
  running: boolean;
  total: number;
  sent: number;
  failed: number;
  currentParticipant?: string;
  errors: { participantId: string; name: string; error: string }[];
  startedAt?: Date;
}

const state: QueueStatus = {
  running: false,
  total: 0,
  sent: 0,
  failed: 0,
  errors: [],
};

const DELAY_BETWEEN_SENDS_MS = 5000; // 5 seconds between sends to avoid rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getAdmitCardQueueStatus(): QueueStatus {
  return { ...state };
}

export function stopAdmitCardQueue(): void {
  state.running = false;
  console.log('[AdmitCardQueue] Stop requested');
}

export async function startAdmitCardQueue(): Promise<{ message: string }> {
  if (state.running) {
    return { message: 'Queue is already running' };
  }

  state.running = true;
  state.sent = 0;
  state.failed = 0;
  state.errors = [];
  state.startedAt = new Date();
  state.currentParticipant = undefined;

  // Count total pending
  const totalPending = await Participant.countDocuments({
    paymentStatus: 'COMPLETED',
    rollNumber: { $exists: true, $ne: null },
    admitCardWhatsappSentAt: { $exists: false },
  });
  state.total = totalPending;

  console.log(`[AdmitCardQueue] Starting. ${totalPending} participants pending.`);

  // Process in background (don't await)
  processQueue().catch((err) => {
    console.error('[AdmitCardQueue] Fatal error:', err);
    state.running = false;
  });

  return { message: `Queue started. ${totalPending} admit cards to send.` };
}

async function processQueue(): Promise<void> {
  const portalConfig = await PortalConfig.findOne().lean();

  while (state.running) {
    const participant = await Participant.findOne({
      paymentStatus: 'COMPLETED',
      rollNumber: { $exists: true, $ne: null },
      admitCardWhatsappSentAt: { $exists: false },
    });

    if (!participant) {
      console.log('[AdmitCardQueue] All done. No more participants pending.');
      break;
    }

    state.currentParticipant = participant.name;

    try {
      // Generate PDF
      const pdfData: AdmitCardData = {
        rollNumber: participant.rollNumber!,
        name: participant.name,
        class: participant.class,
        batchType: participant.batchType,
        guardianName: participant.guardianName,
        mobileNumber: participant.mobileNumber,
        photoUrl: participant.photoUrl,
        eventName: 'Quiz Champ 2026',
        eventDate: portalConfig?.eventDate
          ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
          : undefined,
        eventTime: portalConfig?.eventTime,
        reportingTime: portalConfig?.reportingTime,
        examTime: portalConfig?.examTime,
        venue: portalConfig?.venue,
        venueMapUrl: portalConfig?.venueMapUrl,
        participantId: participant._id.toString(),
        questionPaperLanguage: participant.questionPaperLanguage,
      };

      const pdfBuffer = await generateAdmitCardPDF(pdfData);

      // Send via WhatsApp (PDF with caption)
      const filename = `AdmitCard_${participant.rollNumber}`;
      const examDate = portalConfig?.eventDate
        ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })
        : 'To be announced';

      await sendAdmitCardWhatsApp(participant.mobileNumber, pdfBuffer, filename, {
        name: participant.name,
        rollNumber: participant.rollNumber!,
        batchType: participant.batchType,
        examDate,
      });

      // Mark as sent
      participant.admitCardWhatsappSentAt = new Date();
      await participant.save();
      state.sent++;

      console.log(`[AdmitCardQueue] ✅ Sent to ${participant.name} (${participant.rollNumber}). Progress: ${state.sent}/${state.total}`);
    } catch (err: any) {
      state.failed++;
      state.errors.push({
        participantId: participant._id.toString(),
        name: participant.name,
        error: err.message || 'Unknown error',
      });
      console.error(`[AdmitCardQueue] ❌ Failed for ${participant.name}:`, err.message);
    }

    // Delay between sends
    if (state.running) {
      await sleep(DELAY_BETWEEN_SENDS_MS);
    }
  }

  state.running = false;
  state.currentParticipant = undefined;
  console.log(`[AdmitCardQueue] Finished. Sent: ${state.sent}, Failed: ${state.failed}`);
}
