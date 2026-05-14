export interface PaymentStatus {
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    transactionId: string;
    amount: number;
    timestamp: Date;
}
/**
 * Verify payment status with the payment gateway
 */
export declare function verifyPaymentStatus(merchantTransactionId: string): Promise<PaymentStatus>;
/**
 * Process payment verification and update participant record
 */
export declare function processPaymentVerification(merchantTransactionId: string): Promise<void>;
/**
 * Schedule a background job to verify payment status
 * This is a placeholder - actual implementation would use a job queue like Bull
 */
export declare function scheduleVerificationJob(merchantTransactionId: string, retryCount?: number): Promise<void>;
//# sourceMappingURL=paymentVerification.d.ts.map