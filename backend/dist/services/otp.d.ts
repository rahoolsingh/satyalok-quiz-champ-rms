export declare function generateOTP(): string;
export declare function createOTP(mobileNumber: string): Promise<string>;
export declare function verifyOTP(mobileNumber: string, otp: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Sends OTP via WhatsApp API.
 * Set WHATSAPP_PROVIDER=mock to skip the real call during development.
 * Falls back to SMS if WhatsApp fails after 3 attempts.
 */
export declare function sendOTP(mobileNumber: string, otp: string): Promise<void>;
//# sourceMappingURL=otp.d.ts.map