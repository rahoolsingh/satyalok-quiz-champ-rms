import { Router, Request, Response } from 'express';
import { validateRegistration } from '../services/validation';
import { createOTP, verifyOTP, sendOTP } from '../services/otp';
import { createPaymentSession, verifyPayment } from '../services/payment';
import { generateUniqueRollNumber } from '../services/rollNumber';
import { generateAdmitCardData, generateAdmitCardHtml } from '../services/admitCard';
import { Participant } from '../db/models';
import { RegistrationInput } from '../types';

export const registrationRouter = Router();

// POST /api/registration
registrationRouter.post('/', async (req: Request, res: Response) => {
  try {
    const input: Partial<RegistrationInput> = req.body;
    const validation = validateRegistration(input);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const data = input as RegistrationInput;
    const mobile = data.mobileNumber.trim();

    const existing = await Participant.findOne({ mobileNumber: mobile, paymentStatus: 'COMPLETED' });
    if (existing) {
      return res.status(409).json({ error: 'A registration with this mobile number already exists' });
    }

    await Participant.create({
      name: data.name.trim(),
      class: data.class.trim(),
      batchType: data.batchType,
      guardianName: data.guardianName.trim(),
      address: data.address.trim(),
      mobileNumber: mobile,
      email: data.email?.trim() || undefined,
      referralSource: data.referralSource?.trim() || undefined,
      paymentStatus: 'PENDING',
    });

    const otp = await createOTP(mobile);
    await sendOTP(mobile, otp);

    return res.status(201).json({
      message: 'OTP sent to your mobile number',
      mobileNumber: mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/registration/verify-otp
registrationRouter.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    const result = await verifyOTP(mobileNumber, otp);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const participant = await Participant.findOne({ mobileNumber, paymentStatus: 'PENDING' }).sort({
      createdAt: -1,
    });
    if (!participant) {
      return res.status(404).json({ error: 'No pending registration found for this mobile number' });
    }

    const session = await createPaymentSession(participant._id.toString());
    return res.json({ message: 'OTP verified successfully', paymentSession: session });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'OTP verification failed' });
  }
});

// POST /api/registration/confirm-payment
registrationRouter.post('/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { participantId, sessionId, providerPaymentId, providerSignature } = req.body;
    if (!participantId || !sessionId) {
      return res.status(400).json({ error: 'Participant ID and session ID are required' });
    }

    const confirmation = await verifyPayment(sessionId, providerPaymentId || '', providerSignature || '');
    if (!confirmation.success) {
      await Participant.findByIdAndUpdate(participantId, { paymentStatus: 'FAILED' });
      return res.status(400).json({ error: confirmation.error || 'Payment verification failed' });
    }

    const rollNumber = await generateUniqueRollNumber();
    const participant = await Participant.findByIdAndUpdate(
      participantId,
      { paymentStatus: 'COMPLETED', paymentId: confirmation.paymentId, rollNumber },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const admitCardData = generateAdmitCardData({
      id: participant._id.toString(),
      rollNumber: participant.rollNumber ?? null,
      name: participant.name,
      class: participant.class,
      batchType: participant.batchType,
      guardianName: participant.guardianName,
      address: participant.address,
      mobileNumber: participant.mobileNumber,
      paymentStatus: participant.paymentStatus,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    });

    return res.json({
      message: 'Payment confirmed. Admit card generated.',
      admitCard: admitCardData,
      participantId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

// GET /api/registration/admit-card/:id
registrationRouter.get('/admit-card/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const participant = await Participant.findById(id);

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    if (participant.paymentStatus !== 'COMPLETED') {
      return res.status(403).json({ error: 'Admit card not available. Payment not completed.' });
    }

    const admitCardData = generateAdmitCardData({
      id: participant._id.toString(),
      rollNumber: participant.rollNumber ?? null,
      name: participant.name,
      class: participant.class,
      batchType: participant.batchType,
      guardianName: participant.guardianName,
      address: participant.address,
      mobileNumber: participant.mobileNumber,
      paymentStatus: participant.paymentStatus,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    });

    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      return res.send(generateAdmitCardHtml(admitCardData));
    }

    return res.json({ admitCard: admitCardData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to retrieve admit card' });
  }
});
