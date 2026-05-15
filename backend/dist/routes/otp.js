"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpRouter = void 0;
exports.maskMobile = maskMobile;
const express_1 = require("express");
const otp_1 = require("../services/otp");
const sessionToken_1 = require("../services/sessionToken");
const models_1 = require("../db/models");
const otpRateLimit_1 = require("../middleware/otpRateLimit");
exports.otpRouter = (0, express_1.Router)();
/**
 * Masks a 10-digit mobile number: shows first 2 and last 2 digits.
 * e.g. 9876543210 → 98******10
 */
function maskMobile(mobile) {
    return mobile.replace(/^(\d{2})\d{6}(\d{2})$/, '$1******$2');
}
// POST /api/otp/send
exports.otpRouter.post('/send', otpRateLimit_1.ipOtpLimiter, otpRateLimit_1.mobileOtpLimiter, async (req, res) => {
    try {
        const { mobileNumber } = req.body;
        if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
            return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required' });
        }
        const mobile = mobileNumber.trim();
        // Allow login for all users (removed restriction for completed registrations)
        // Users can login anytime to view their admit card
        const otp = await (0, otp_1.createOTP)(mobile);
        await (0, otp_1.sendOTP)(mobile, otp);
        return res.json({
            message: 'OTP sent successfully via WhatsApp',
            maskedMobile: maskMobile(mobile),
            deliveryMethod: 'whatsapp',
        });
    }
    catch (err) {
        console.error('[otp/send]', err);
        return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
});
// POST /api/otp/verify
exports.otpRouter.post('/verify', async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;
        if (!mobileNumber || !otp) {
            return res.status(400).json({ error: 'Mobile number and OTP are required' });
        }
        const mobile = mobileNumber.trim();
        const result = await (0, otp_1.verifyOTP)(mobile, otp);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        // Issue session token
        const sessionToken = (0, sessionToken_1.signSessionToken)(mobile);
        // Set secure HTTP-only cookie (works on same-domain and some browsers)
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('sessionToken', sessionToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/',
        });
        // Update otpVerifiedAt on any existing participant record
        await models_1.Participant.findOneAndUpdate({ mobileNumber: mobile }, { otpVerifiedAt: new Date() }, { sort: { createdAt: -1 } });
        // Check for any existing registration (completed, pending, or failed)
        const participant = await models_1.Participant.findOne({ mobileNumber: mobile })
            .sort({ createdAt: -1 })
            .lean();
        if (!participant) {
            // New user - no profile data
            return res.json({
                message: 'OTP verified successfully',
                sessionToken,
                profile: null,
            });
        }
        // If payment is PENDING, verify with payment gateway (check last 3 pending payments)
        if (participant.paymentStatus === 'PENDING' && participant.merchantTransactionId) {
            console.log(`[otp/verify] Checking pending payment for ${mobile}`);
            // Import verification service dynamically to avoid circular dependency
            const { verifyPaymentStatus, processPaymentVerification } = await Promise.resolve().then(() => __importStar(require('../services/paymentVerification')));
            try {
                const paymentStatus = await verifyPaymentStatus(participant.merchantTransactionId);
                if (paymentStatus.status === 'SUCCESS') {
                    console.log(`[otp/verify] Payment was successful but not captured. Processing now...`);
                    // Process the payment verification to update status and send notifications
                    await processPaymentVerification(participant.merchantTransactionId);
                    // Fetch updated participant data
                    const updatedParticipant = await models_1.Participant.findById(participant._id).lean();
                    if (updatedParticipant) {
                        const profile = {
                            participantId: updatedParticipant._id.toString(),
                            name: updatedParticipant.name,
                            class: updatedParticipant.class,
                            batchType: updatedParticipant.batchType,
                            guardianName: updatedParticipant.guardianName,
                            address: updatedParticipant.address,
                            mobileNumber: updatedParticipant.mobileNumber,
                            email: updatedParticipant.email,
                            referralSource: updatedParticipant.referralSource,
                            photoUrl: updatedParticipant.photoUrl,
                            paymentStatus: updatedParticipant.paymentStatus,
                            merchantTransactionId: updatedParticipant.merchantTransactionId,
                            rollNumber: updatedParticipant.rollNumber,
                            registeredAt: updatedParticipant.createdAt,
                        };
                        return res.json({
                            message: 'OTP verified successfully. Payment status updated!',
                            sessionToken,
                            profile,
                        });
                    }
                }
            }
            catch (error) {
                console.error('[otp/verify] Error checking pending payment:', error);
                // Continue with existing data if verification fails
            }
        }
        // Return complete profile data
        const profile = {
            participantId: participant._id.toString(),
            name: participant.name,
            class: participant.class,
            batchType: participant.batchType,
            guardianName: participant.guardianName,
            address: participant.address,
            mobileNumber: participant.mobileNumber,
            email: participant.email,
            referralSource: participant.referralSource,
            photoUrl: participant.photoUrl,
            paymentStatus: participant.paymentStatus,
            merchantTransactionId: participant.merchantTransactionId,
            rollNumber: participant.rollNumber,
            registeredAt: participant.createdAt,
        };
        return res.json({
            message: 'OTP verified successfully',
            sessionToken,
            profile,
        });
    }
    catch (err) {
        console.error('[otp/verify]', err);
        return res.status(500).json({ error: 'OTP verification failed' });
    }
});
// POST /api/otp/logout
exports.otpRouter.post('/logout', async (_req, res) => {
    try {
        // Clear the session cookie
        res.clearCookie('sessionToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : "strict",
            path: '/',
        });
        return res.json({ message: 'Logged out successfully' });
    }
    catch (err) {
        console.error('[otp/logout]', err);
        return res.status(500).json({ error: 'Logout failed' });
    }
});
//# sourceMappingURL=otp.js.map