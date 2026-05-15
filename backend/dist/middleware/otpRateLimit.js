"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipOtpLimiter = void 0;
exports.mobileOtpLimiter = mobileOtpLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const models_1 = require("../db/models");
const COOLDOWN_SECONDS = 60;
const BURST_LIMIT = 5;
const BURST_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const BLOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
// ─── IP-based limiter (10 req/min per IP) ────────────────────────────────────
exports.ipOtpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many OTP requests from this IP. Please try again later.' },
    keyGenerator: (req) => req.ip || 'unknown',
});
// ─── Per-mobile cooldown + burst limiter ─────────────────────────────────────
/**
 * Checks and updates the per-mobile OTP rate limit.
 * Enforces:
 *   - 60s cooldown between requests
 *   - Max 5 requests per 10-minute window (then blocked for 10 min)
 */
async function mobileOtpLimiter(req, res, next) {
    const mobile = req.body?.mobileNumber;
    if (!mobile) {
        next();
        return;
    }
    const now = new Date();
    let record = await models_1.OtpRateLimit.findOne({ mobileNumber: mobile });
    if (record) {
        // Check if currently blocked
        if (record.blockedUntil && record.blockedUntil > now) {
            const retryAfterSeconds = Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000);
            res.status(429).json({
                error: 'Too many OTP requests. Please try again later.',
                retryAfterSeconds,
                blocked: true,
            });
            return;
        }
        // Check cooldown (60s since last request)
        const secondsSinceLast = (now.getTime() - record.lastRequestAt.getTime()) / 1000;
        if (secondsSinceLast < COOLDOWN_SECONDS) {
            const retryAfterSeconds = Math.ceil(COOLDOWN_SECONDS - secondsSinceLast);
            res.status(429).json({
                error: `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`,
                retryAfterSeconds,
            });
            return;
        }
        // Reset window if it's been more than 10 minutes
        const windowExpired = now.getTime() - record.windowStart.getTime() > BURST_WINDOW_MS;
        if (windowExpired) {
            record.requestCount = 0;
            record.windowStart = now;
            record.blockedUntil = undefined;
        }
        // Check burst limit
        if (record.requestCount >= BURST_LIMIT) {
            const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);
            record.blockedUntil = blockedUntil;
            await record.save();
            res.status(429).json({
                error: 'Too many OTP requests. You are blocked for 10 minutes.',
                retryAfterSeconds: BLOCK_DURATION_MS / 1000,
                blocked: true,
            });
            return;
        }
        record.requestCount += 1;
        record.lastRequestAt = now;
        await record.save();
    }
    else {
        await models_1.OtpRateLimit.create({
            mobileNumber: mobile,
            requestCount: 1,
            windowStart: now,
            lastRequestAt: now,
        });
    }
    next();
}
//# sourceMappingURL=otpRateLimit.js.map