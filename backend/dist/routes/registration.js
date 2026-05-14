"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const validation_1 = require("../services/validation");
const payment_1 = require("../services/payment");
const pgsClient_1 = require("../services/pgsClient");
const admitCard_1 = require("../services/admitCard");
const storage_1 = require("../services/storage");
const models_1 = require("../db/models");
const sessionAuth_1 = require("../middleware/sessionAuth");
const validation_2 = require("../services/validation");
const admitCardPdf_1 = require("../services/admitCardPdf");
exports.registrationRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});
// ─── Helper: build draft response shape ──────────────────────────────────────
function draftShape(p) {
    return {
        participantId: p._id.toString(),
        name: p.name,
        class: p.class,
        batchType: p.batchType,
        guardianName: p.guardianName,
        address: p.address,
        mobileNumber: p.mobileNumber,
        email: p.email,
        referralSource: p.referralSource,
        photoUrl: p.photoUrl,
        paymentStatus: p.paymentStatus,
        merchantTransactionId: p.merchantTransactionId,
        createdAt: p.createdAt,
    };
}
// ─── POST /api/registration/draft ────────────────────────────────────────────
// Authenticated. Multipart. Upserts participant record. Accepts optional photo.
exports.registrationRouter.post('/draft', sessionAuth_1.sessionAuthMiddleware, upload.single('photo'), async (req, res) => {
    try {
        const mobile = req.verifiedMobile;
        // Validate mobile matches token
        const bodyMobile = (req.body.mobileNumber || '').trim();
        if (bodyMobile && bodyMobile !== mobile) {
            return res.status(401).json({ error: 'Unauthorized: mobile number does not match session' });
        }
        // Validate form fields
        const input = {
            name: req.body.name,
            class: req.body.class,
            batchType: req.body.batchType,
            guardianName: req.body.guardianName,
            address: req.body.address,
            mobileNumber: mobile,
            email: req.body.email,
            referralSource: req.body.referralSource,
        };
        const validation = (0, validation_1.validateRegistration)(input);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Validation failed', details: validation.errors });
        }
        // Handle photo upload
        let photoUrl;
        if (req.file) {
            if (!(0, validation_2.validateImageFormat)(req.file.mimetype)) {
                return res.status(400).json({ error: 'Accepted photo formats: JPEG, PNG, WebP' });
            }
            const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
            const key = `photos/${(0, uuid_1.v4)()}.${ext}`;
            const result = await (0, storage_1.uploadToS3)(key, req.file.buffer, req.file.mimetype);
            photoUrl = result.url;
        }
        // Check if already completed
        const completed = await models_1.Participant.findOne({ mobileNumber: mobile, paymentStatus: 'COMPLETED' });
        if (completed) {
            return res.status(403).json({ error: 'Cannot edit a completed registration' });
        }
        // Upsert draft
        const updateData = {
            name: input.name.trim(),
            class: input.class.trim(),
            batchType: input.batchType,
            guardianName: input.guardianName.trim(),
            address: input.address.trim(),
            email: input.email?.trim() || undefined,
            referralSource: input.referralSource?.trim() || undefined,
            paymentStatus: 'PENDING',
            otpVerifiedAt: new Date(),
        };
        if (photoUrl)
            updateData.photoUrl = photoUrl;
        const participant = await models_1.Participant.findOneAndUpdate({ mobileNumber: mobile, paymentStatus: { $in: ['PENDING', 'FAILED'] } }, { $set: updateData }, { new: true, upsert: true, setDefaultsOnInsert: true });
        return res.json({
            message: 'Draft saved',
            draft: draftShape(participant),
        });
    }
    catch (err) {
        console.error('[registration/draft POST]', err);
        return res.status(500).json({ error: 'Failed to save draft' });
    }
});
// ─── GET /api/registration/draft ─────────────────────────────────────────────
// Authenticated. Returns current draft for the verified mobile.
exports.registrationRouter.get('/draft', sessionAuth_1.sessionAuthMiddleware, async (req, res) => {
    try {
        const mobile = req.verifiedMobile;
        const participant = await models_1.Participant.findOne({
            mobileNumber: mobile,
            paymentStatus: { $in: ['PENDING', 'FAILED'] },
        }).sort({ createdAt: -1 });
        if (!participant) {
            return res.status(404).json({ error: 'No draft found for this mobile number' });
        }
        return res.json({ draft: draftShape(participant) });
    }
    catch (err) {
        console.error('[registration/draft GET]', err);
        return res.status(500).json({ error: 'Failed to retrieve draft' });
    }
});
// ─── POST /api/registration/initiate-payment ─────────────────────────────────
// Authenticated. Calls PGS and returns redirectUrl.
exports.registrationRouter.post('/initiate-payment', sessionAuth_1.sessionAuthMiddleware, async (req, res) => {
    try {
        const mobile = req.verifiedMobile;
        const participant = await models_1.Participant.findOne({
            mobileNumber: mobile,
            paymentStatus: { $in: ['PENDING', 'FAILED'] },
        }).sort({ createdAt: -1 });
        if (!participant) {
            return res.status(404).json({ error: 'No draft found. Please complete the registration form first.' });
        }
        const amount = await (0, payment_1.getRegistrationFee)(participant.batchType);
        const merchantTransactionId = (0, payment_1.generateMerchantTransactionId)();
        await models_1.Participant.findByIdAndUpdate(participant._id, { merchantTransactionId });
        let pgsResponse;
        try {
            pgsResponse = await (0, pgsClient_1.initiatePhonePePayment)({
                name: participant.name,
                mobileNumber: participant.mobileNumber,
                group: participant.batchType,
                amount,
                merchantTransactionId,
                email: participant.email,
                class: participant.class,
            });
        }
        catch (pgsErr) {
            console.error('PGS initiation failed:', pgsErr);
            return res.status(502).json({ error: 'Payment gateway unavailable. Please try again.' });
        }
        return res.json({
            redirectUrl: pgsResponse.redirectUrl,
            merchantTransactionId,
            amount,
            currency: 'INR',
            participantId: participant._id.toString(),
            provider: 'phonepe',
        });
    }
    catch (err) {
        console.error('[registration/initiate-payment]', err);
        return res.status(500).json({ error: 'Failed to initiate payment' });
    }
});
// ─── GET /api/registration/track ─────────────────────────────────────────────
// Public. Returns registration status by mobile number.
exports.registrationRouter.get('/track', async (req, res) => {
    try {
        const mobile = (req.query.mobile || '').trim();
        if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({ error: 'A valid 10-digit mobile number is required' });
        }
        const participant = await models_1.Participant.findOne({ mobileNumber: mobile }).sort({ createdAt: -1 });
        if (!participant) {
            return res.status(404).json({ error: 'No registration found for this mobile number' });
        }
        const base = {
            participantId: participant._id.toString(),
            name: participant.name,
            batchType: participant.batchType,
            paymentStatus: participant.paymentStatus,
            registeredAt: participant.createdAt,
            rollNumber: participant.rollNumber || null,
        };
        if (participant.paymentStatus === 'COMPLETED') {
            const admitCard = (0, admitCard_1.generateAdmitCardData)({
                id: participant._id.toString(),
                rollNumber: participant.rollNumber ?? null,
                name: participant.name,
                class: participant.class,
                batchType: participant.batchType,
                guardianName: participant.guardianName,
                address: participant.address,
                mobileNumber: participant.mobileNumber,
                paymentStatus: participant.paymentStatus,
                photoUrl: participant.photoUrl,
                createdAt: participant.createdAt,
                updatedAt: participant.updatedAt,
            });
            return res.json({ ...base, admitCard });
        }
        if (participant.paymentStatus === 'PENDING') {
            // Return redirect URL if payment was already initiated
            const redirectUrl = participant.merchantTransactionId
                ? `${process.env.FRONTEND_URL}/payment-redirects/${participant.merchantTransactionId}`
                : null;
            return res.json({ ...base, redirectUrl, canResumePayment: !!redirectUrl });
        }
        // FAILED
        return res.json({
            ...base,
            retryMessage: 'Your previous payment failed. Please try registering again.',
            retryUrl: `${process.env.FRONTEND_URL}/`,
        });
    }
    catch (err) {
        console.error('[registration/track]', err);
        return res.status(500).json({ error: 'Failed to retrieve registration status' });
    }
});
// ─── GET /api/registration/admit-card/:id ────────────────────────────────────
exports.registrationRouter.get('/admit-card/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const participant = await models_1.Participant.findById(id);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        if (participant.paymentStatus !== 'COMPLETED') {
            return res.status(403).json({ error: 'Admit card not available. Payment not completed.' });
        }
        const admitCardData = (0, admitCard_1.generateAdmitCardData)({
            id: participant._id.toString(),
            rollNumber: participant.rollNumber ?? null,
            name: participant.name,
            class: participant.class,
            batchType: participant.batchType,
            guardianName: participant.guardianName,
            address: participant.address,
            mobileNumber: participant.mobileNumber,
            paymentStatus: participant.paymentStatus,
            photoUrl: participant.photoUrl,
            createdAt: participant.createdAt,
            updatedAt: participant.updatedAt,
        });
        if (req.query.format === 'html') {
            res.setHeader('Content-Type', 'text/html');
            return res.send((0, admitCard_1.generateAdmitCardHtml)(admitCardData));
        }
        return res.json({ admitCard: admitCardData });
    }
    catch (err) {
        console.error('[registration/admit-card]', err);
        return res.status(500).json({ error: 'Failed to retrieve admit card' });
    }
});
// ─── Deprecated stubs ─────────────────────────────────────────────────────────
exports.registrationRouter.post('/', async (_req, res) => {
    return res.status(410).json({ error: 'This endpoint is deprecated. Use POST /api/otp/send to start registration.' });
});
exports.registrationRouter.post('/verify-otp', async (_req, res) => {
    return res.status(410).json({ error: 'This endpoint is deprecated. Use POST /api/otp/verify.' });
});
exports.registrationRouter.post('/confirm-payment', async (_req, res) => {
    return res.status(410).json({ error: 'This endpoint is no longer used. Payment is confirmed via PhonePe callback.' });
});
// ─── GET /api/registration/admit-card/:id/download ──────────────────────────
// Download admit card as PDF
exports.registrationRouter.get('/admit-card/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        const participant = await models_1.Participant.findById(id);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        if (participant.paymentStatus !== 'COMPLETED') {
            return res.status(403).json({ error: 'Admit card not available. Payment not completed.' });
        }
        // Get event details from portal config
        const portalConfig = await models_1.PortalConfig.findOne().lean();
        const eventDate = portalConfig?.eventDate
            ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })
            : undefined;
        const pdfBuffer = await (0, admitCardPdf_1.generateAdmitCardPDF)({
            rollNumber: participant.rollNumber ?? 'N/A',
            name: participant.name,
            class: participant.class,
            batchType: participant.batchType,
            guardianName: participant.guardianName,
            mobileNumber: participant.mobileNumber,
            photoUrl: participant.photoUrl,
            eventName: 'Quiz Champ 2026',
            eventDate,
            eventTime: portalConfig?.eventTime,
            venue: portalConfig?.venue,
            venueMapUrl: portalConfig?.venueMapUrl,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="admit-card-${participant.rollNumber}.pdf"`);
        // Track admit card download
        if (!participant.admitCardDownloaded) {
            participant.admitCardDownloaded = true;
            await participant.save();
        }
        res.send(pdfBuffer);
    }
    catch (err) {
        console.error('[registration/admit-card/download]', err);
        return res.status(500).json({ error: 'Failed to generate admit card PDF' });
    }
});
//# sourceMappingURL=registration.js.map