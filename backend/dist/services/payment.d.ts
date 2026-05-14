import { BatchType } from '../types';
/**
 * Returns the registration fee for a given batch type.
 * Reads from PortalConfig in DB; falls back to defaults if not set.
 * The fee is derived solely from batchType — never from client input.
 */
export declare function getRegistrationFee(batchType: BatchType): Promise<number>;
/**
 * Generates a unique merchant transaction ID prefixed with QC26.
 * Format: QC26{timestamp}{randomUpperChar}
 */
export declare function generateMerchantTransactionId(): string;
//# sourceMappingURL=payment.d.ts.map