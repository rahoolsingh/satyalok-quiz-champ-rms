import { BatchType } from '../types';
import { PortalConfig } from '../db/models';

// ─── Default fees (used if DB not yet configured) ─────────────────────────────
const DEFAULT_FEES: Record<BatchType, number> = {
  JUNIOR: 100,
  SENIOR: 150,
};

/**
 * Returns the registration fee for a given batch type.
 * Reads from PortalConfig in DB; falls back to defaults if not set.
 * The fee is derived solely from batchType — never from client input.
 */
export async function getRegistrationFee(batchType: BatchType): Promise<number> {
  const config = await PortalConfig.findOne().lean();
  if (batchType === 'JUNIOR') return config?.feeJunior ?? DEFAULT_FEES.JUNIOR;
  if (batchType === 'SENIOR') return config?.feeSenior ?? DEFAULT_FEES.SENIOR;
  throw new Error(`Unknown batchType: ${batchType}`);
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
