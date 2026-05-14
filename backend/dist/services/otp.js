"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = generateOTP;
exports.createOTP = createOTP;
exports.verifyOTP = verifyOTP;
exports.sendOTP = sendOTP;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../db/models");
const whatsapp_1 = require("./whatsapp");
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
function generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
}
async function createOTP(mobileNumber) {
    const otp = generateOTP();
    const otpHash = await bcryptjs_1.default.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    // Invalidate previous OTPs for this number
    await models_1.OTPVerification.updateMany({ mobileNumber, verified: false }, { $set: { verified: true } });
    await models_1.OTPVerification.create({ mobileNumber, otpHash, expiresAt });
    return otp;
}
async function verifyOTP(mobileNumber, otp) {
    const record = await models_1.OTPVerification.findOne({ mobileNumber, verified: false }).sort({
        createdAt: -1,
    });
    if (!record) {
        return { success: false, error: 'No active OTP found. Please request a new OTP.' };
    }
    if (new Date() > record.expiresAt) {
        return { success: false, error: 'OTP has expired. Please request a new OTP.' };
    }
    if (record.attempts >= MAX_ATTEMPTS) {
        return { success: false, error: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
    }
    record.attempts += 1;
    await record.save();
    const isValid = await bcryptjs_1.default.compare(otp, record.otpHash);
    if (!isValid) {
        return { success: false, error: 'Invalid OTP. Please try again.' };
    }
    record.verified = true;
    await record.save();
    return { success: true };
}
/**
 * Sends OTP via WhatsApp API.
 * Set WHATSAPP_PROVIDER=mock to skip the real call during development.
 * Falls back to SMS if WhatsApp fails after 3 attempts.
 */
async function sendOTP(mobileNumber, otp) {
    const provider = process.env.WHATSAPP_PROVIDER || 'mock';
    // Try WhatsApp first
    try {
        await (0, whatsapp_1.sendWhatsAppOTP)(mobileNumber, otp);
        return;
    }
    catch (whatsappError) {
        console.error('[OTP] WhatsApp delivery failed, attempting SMS fallback:', whatsappError);
        // Fallback to SMS
        const smsProvider = process.env.SMS_PROVIDER || 'mock';
        if (smsProvider === 'mock') {
            console.log(`[MOCK SMS FALLBACK] OTP ${otp} → ${mobileNumber}`);
            return;
        }
        const smsApiUrl = process.env.SMS_API_URL;
        const smsApiKey = process.env.SMS_API_KEY;
        if (!smsApiUrl || !smsApiKey) {
            console.error('[OTP] SMS fallback not configured');
            throw new Error('Failed to send OTP via WhatsApp and SMS is not configured');
        }
        const message = otpTemplate(otp);
        console.log('[OTP] Sending via SMS fallback to', mobileNumber);
        const response = await axios_1.default.post(smsApiUrl, { mobileNumber: `91${mobileNumber}`, message }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': smsApiKey,
            },
        });
        console.log('[OTP] SMS fallback response:', response.data);
    }
}
// ─── SMS template ─────────────────────────────────────────────────────────────
function otpTemplate(otp) {
    return `Your Quiz Champ 2026 OTP is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`;
}
//# sourceMappingURL=otp.js.map