import { Participant, PortalConfig } from '../db/models';
import { generateAdmitCardData } from './admitCard';
import { sendThankYouMessage, sendGroupInvite } from './whatsapp';
import { sendEmail, generateAdmitCardEmail } from './email';
import { generateAdmitCardPDF } from './admitCardPdf';
import { verifyPhonePePayment, PGSError } from './pgsClient';

export interface PaymentStatus {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId: string;
  amount: number;
  timestamp: Date;
}

/**
 * Verify payment status with the payment gateway
 */
export async function verifyPaymentStatus(
  merchantTransactionId: string
): Promise<PaymentStatus> {
  try {
    console.log(`[Payment Verification] Checking status for ${merchantTransactionId}`);

    const response = await verifyPhonePePayment(merchantTransactionId);

    if (!response.success || !response.data) {
      console.log(`[Payment Verification] Payment still pending for ${merchantTransactionId}`);
      return {
        status: 'PENDING',
        transactionId: merchantTransactionId,
        amount: 0,
        timestamp: new Date(),
      };
    }

    const { state, amount, transactionId } = response.data;
    const mappedStatus = mapPaymentStatus(state);

    console.log(`[Payment Verification] Status: ${mappedStatus} (gateway state: ${state})`);

    return {
      status: mappedStatus,
      transactionId: transactionId || merchantTransactionId,
      amount: amount || 0,
      timestamp: new Date(),
    };
  } catch (error) {
    if (error instanceof PGSError) {
      console.error('[Payment Verification] PGS Error:', error.message);
    } else {
      console.error('[Payment Verification] Error:', error);
    }
    
    // If we can't reach the gateway, return PENDING
    return {
      status: 'PENDING',
      transactionId: merchantTransactionId,
      amount: 0,
      timestamp: new Date(),
    };
  }
}

/**
 * Map payment gateway status to internal status
 */
function mapPaymentStatus(gatewayStatus: string): 'SUCCESS' | 'FAILED' | 'PENDING' {
  const status = gatewayStatus.toUpperCase();
  
  if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'PAYMENT_SUCCESS') {
    return 'SUCCESS';
  }
  
  if (status === 'FAILED' || status === 'PAYMENT_ERROR' || status === 'PAYMENT_DECLINED') {
    return 'FAILED';
  }
  
  return 'PENDING';
}

/**
 * Process payment verification and update participant record
 */
export async function processPaymentVerification(
  merchantTransactionId: string
): Promise<void> {
  try {
    // Find participant by merchant transaction ID
    const participant = await Participant.findOne({ merchantTransactionId });

    if (!participant) {
      console.error(`[Payment Verification] No participant found for ${merchantTransactionId}`);
      return;
    }

    // Skip if already processed
    if (participant.paymentStatus === 'COMPLETED') {
      console.log(`[Payment Verification] Payment already completed for ${merchantTransactionId}`);
      return;
    }

    // Verify payment status
    const paymentStatus = await verifyPaymentStatus(merchantTransactionId);

    if (paymentStatus.status === 'SUCCESS') {
      // Update participant to COMPLETED
      participant.paymentStatus = 'COMPLETED';
      participant.updatedAt = new Date();
      
      // Generate roll number if not exists
      if (!participant.rollNumber) {
        participant.rollNumber = await generateRollNumber(participant.batchType);
      }

      await participant.save();

      console.log(`[Payment Verification] Payment completed for ${participant.name}`);

      // Send WhatsApp thank you message (only once)
      if (!participant.thankYouMessageSent) {
        try {
          // Get event details from portal config
          const portalConfig = await PortalConfig.findOne().lean();
          
          const eventDate = portalConfig?.eventDate 
            ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'To be announced';
          
          const eventTime = portalConfig?.eventTime || 'To be announced';
          const venue = portalConfig?.venue || 'To be announced';
          
          const admitCardUrl = `${process.env.FRONTEND_URL}/api/registration/admit-card/${participant._id}`;
          const portalUrl = process.env.FRONTEND_URL || 'https://satyalok.in';
          
          await sendThankYouMessage(participant.mobileNumber, {
            name: participant.name,
            rollNumber: participant.rollNumber!,
            admitCardUrl,
            portalUrl,
            eventDate,
            eventTime,
            venue,
          });

          // Mark as sent
          participant.thankYouMessageSent = true;
          await participant.save();

          console.log(`[Payment Verification] Thank you message sent to ${participant.mobileNumber}`);

          // Send group invite link separately (only once)
          if (!participant.groupInviteSent) {
            try {
              await sendGroupInvite(participant.mobileNumber);
              participant.groupInviteSent = true;
              await participant.save();
              console.log(`[Payment Verification] Group invite sent to ${participant.mobileNumber}`);
            } catch (inviteError) {
              console.error('[Payment Verification] Failed to send group invite:', inviteError);
            }
          }
        } catch (messageError) {
          console.error('[Payment Verification] Failed to send thank you message:', messageError);
          // Don't fail the whole process if message fails
        }
      } else {
        console.log(`[Payment Verification] Thank you message already sent to ${participant.mobileNumber}`);
      }

      // Send email with admit card
      try {
        const admitCardData = generateAdmitCardData({
          id: participant._id.toString(),
          rollNumber: participant.rollNumber!,
          name: participant.name,
          class: participant.class,
          batchType: participant.batchType,
          guardianName: participant.guardianName,
          address: participant.address,
          mobileNumber: participant.mobileNumber,
          paymentStatus: participant.paymentStatus,
          photoUrl: participant.photoUrl,
          createdAt: participant.createdAt,
          updatedAt: participant.updatedAt,
        });

        if (participant.email) {
          // Get event details from portal config
          const portalConfig = await PortalConfig.findOne().lean();
          
          const eventDate = portalConfig?.eventDate 
            ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : undefined;
          
          const pdfBuffer = await generateAdmitCardPDF({
            rollNumber: participant.rollNumber!,
            name: participant.name,
            class: participant.class,
            batchType: participant.batchType,
            guardianName: participant.guardianName,
            mobileNumber: participant.mobileNumber,
            photoUrl: participant.photoUrl,
            eventName: 'Quiz Champ 2026',
            eventDate,
            eventTime: portalConfig?.eventTime,
            venue: portalConfig?.venue,
            venueMapUrl: portalConfig?.venueMapUrl,
          });

          const emailHtml = generateAdmitCardEmail({
            name: participant.name,
            rollNumber: participant.rollNumber!,
            batch: participant.batchType,
          });

          await sendEmail({
            to: participant.email,
            subject: 'Quiz Champ 2026 - Your Admit Card',
            html: emailHtml,
            attachments: [{
              filename: `admit-card-${participant.rollNumber}.pdf`,
              content: pdfBuffer,
            }],
          });

          console.log(`[Payment Verification] Email sent to ${participant.email}`);
        }
      } catch (emailError) {
        console.error('[Payment Verification] Failed to send email:', emailError);
        // Don't fail the whole process if email fails
      }

    } else if (paymentStatus.status === 'FAILED') {
      // Update participant to FAILED
      participant.paymentStatus = 'FAILED';
      participant.updatedAt = new Date();
      await participant.save();

      console.log(`[Payment Verification] Payment failed for ${participant.name}`);
    } else {
      // PENDING - will be retried later
      console.log(`[Payment Verification] Payment still pending for ${merchantTransactionId}`);
    }

  } catch (error) {
    console.error('[Payment Verification] Error processing verification:', error);
    throw error;
  }
}

/**
 * Generate a unique roll number for a participant
 */
async function generateRollNumber(batchType: string): Promise<string> {
  const prefix = batchType === 'JUNIOR' ? 'JR' : 'SR';
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Count existing participants with roll numbers for this batch
  const count = await Participant.countDocuments({
    batchType,
    rollNumber: { $exists: true, $ne: null },
  });

  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}${year}${sequence}`;
  // Example: JR260001, SR260001
}

/**
 * Schedule a background job to verify payment status
 * This is a placeholder - actual implementation would use a job queue like Bull
 */
export async function scheduleVerificationJob(
  merchantTransactionId: string,
  retryCount: number = 0
): Promise<void> {
  console.log(`[Payment Verification] Scheduling verification job for ${merchantTransactionId}, retry ${retryCount}`);
  
  // In a real implementation, this would add a job to a queue
  // For now, we'll just log it
  // TODO: Implement with Bull/Agenda when task 12 is completed
}
