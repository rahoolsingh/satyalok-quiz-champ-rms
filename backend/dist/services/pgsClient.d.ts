import { BatchType } from '../types';
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
/**
 * Calls POST /quizChampOrderS2S on the PGS.
 * Returns the PhonePe redirect URL and the merchantTransactionId.
 * Throws on any non-2xx response.
 */
export declare function initiatePhonePePayment(order: PGSOrderRequest): Promise<PGSOrderResponse>;
/**
 * Calls GET /quizChampStatusS2S?id={merchantTransactionId} on the PGS.
 * Returns the payment status.
 * Throws on any non-2xx response.
 */
export declare function verifyPhonePePayment(merchantTransactionId: string): Promise<PGSStatusResponse>;
export declare class PGSError extends Error {
    readonly httpStatus?: number | undefined;
    constructor(message: string, httpStatus?: number | undefined);
}
//# sourceMappingURL=pgsClient.d.ts.map