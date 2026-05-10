import { BatchType } from '../types';

// ─── Fee table ────────────────────────────────────────────────────────────────
const REGISTRATION_FEES: Record<BatchType, number> = {
  JUNIOR: 100,
  SENIOR: 150,
};

/**
 * Returns the canonical registration fee for a given batch type.
 * The fee is derived solely from batchType — never from client input.
 */
export function getRegistrationFee(batchType: BatchType): number {
  const fee = REGISTRATION_FEES[batchType];
  if (fee === undefined) {
    throw new Error(`Unknown batchType: ${batchType}`);
  }
  return fee;
}

// ─── Merchant Transaction ID ──────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates a unique merchant transaction ID prefixed with QC26.
 * Format: QC26{timestamp}{randomUpperChar}
 */
export function generateMerchantTransactionId(): string {
  const randomChar = CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  return `QC26${Date.now()}${randomChar}`;
}
