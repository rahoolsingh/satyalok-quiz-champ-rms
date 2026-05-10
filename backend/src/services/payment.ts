import { v4 as uuidv4 } from 'uuid';

export interface PaymentSession {
  sessionId: string;
  amount: number;
  currency: string;
  participantId: string;
  provider: string;
  providerOrderId?: string;
}

export interface PaymentConfirmation {
  success: boolean;
  paymentId?: string;
  error?: string;
}

const REGISTRATION_FEE = 100; // in INR (paise for Razorpay = 10000)

export async function createPaymentSession(participantId: string): Promise<PaymentSession> {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';

  if (provider === 'mock') {
    return {
      sessionId: uuidv4(),
      amount: REGISTRATION_FEE,
      currency: 'INR',
      participantId,
      provider: 'mock',
      providerOrderId: `mock_order_${uuidv4()}`,
    };
  }

  // Razorpay integration would go here
  throw new Error(`Payment provider ${provider} not implemented`);
}

export async function verifyPayment(
  _sessionId: string,
  _providerPaymentId: string,
  _providerSignature: string
): Promise<PaymentConfirmation> {
  const provider = process.env.PAYMENT_PROVIDER || 'mock';

  if (provider === 'mock') {
    return {
      success: true,
      paymentId: `mock_pay_${uuidv4()}`,
    };
  }

  // Razorpay signature verification would go here
  throw new Error(`Payment provider ${provider} not implemented`);
}
