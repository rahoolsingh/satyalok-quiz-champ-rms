import axios, { AxiosError } from 'axios';
import { BatchType } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PGSOrderRequest {
  name: string;
  mobileNumber: string;
  group: BatchType;
  amount: number;
  merchantTransactionId: string;
  email?: string;
  class?: string;
}

export interface PGSOrderResponse {
  redirectUrl: string;
  merchantTransactionId: string;
}

export interface PGSStatusResponse {
  success: boolean;
  data?: {
    transactionId: string;
    amount: number;
    state: string;
  };
  message?: string;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

function getPgsAxios() {
  const baseURL = process.env.PGS_BASE_URL;
  const apiKey = process.env.PGS_API_KEY;

  if (!baseURL) throw new Error('PGS_BASE_URL environment variable is not set');
  if (!apiKey) throw new Error('PGS_API_KEY environment variable is not set');

  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    timeout: 15000,
  });
}

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Calls POST /quizChampOrderS2S on the PGS.
 * Returns the PhonePe redirect URL and the merchantTransactionId.
 * Throws on any non-2xx response.
 */
export async function initiatePhonePePayment(
  order: PGSOrderRequest
): Promise<PGSOrderResponse> {
  const pgs = getPgsAxios();
  try {
    const res = await pgs.post<PGSOrderResponse>('/quizChampOrderS2S', order);
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    const message = axiosErr.response?.data?.message || axiosErr.message;
    throw new PGSError(`PGS order initiation failed (${status}): ${message}`, status);
  }
}

/**
 * Calls GET /quizChampStatusS2S?id={merchantTransactionId} on the PGS.
 * Returns the payment status.
 * Throws on any non-2xx response.
 */
export async function verifyPhonePePayment(
  merchantTransactionId: string
): Promise<PGSStatusResponse> {
  const pgs = getPgsAxios();
  try {
    const res = await pgs.get<PGSStatusResponse>('/quizChampStatusS2S', {
      params: { id: merchantTransactionId },
    });
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    const message = axiosErr.response?.data?.message || axiosErr.message;
    throw new PGSError(`PGS status check failed (${status}): ${message}`, status);
  }
}

// ─── Custom error ─────────────────────────────────────────────────────────────

export class PGSError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = 'PGSError';
  }
}
