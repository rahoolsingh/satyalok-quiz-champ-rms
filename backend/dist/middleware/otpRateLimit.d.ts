import { Request, Response, NextFunction } from 'express';
export declare const ipOtpLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Checks and updates the per-mobile OTP rate limit.
 * Enforces:
 *   - 60s cooldown between requests
 *   - Max 5 requests per 10-minute window (then blocked for 10 min)
 */
export declare function mobileOtpLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=otpRateLimit.d.ts.map