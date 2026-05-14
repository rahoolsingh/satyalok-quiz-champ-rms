"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const sync_1 = require("csv-parse/sync");
const uuid_1 = require("uuid");
const models_1 = require("../db/models");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../services/validation");
const rollNumber_1 = require("../services/rollNumber");
const whatsapp_1 = require("../services/whatsapp");
const storage_1 = require("../services/storage");
exports.adminRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
// POST /api/admin/login
exports.adminRouter.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        const admin = await models_1.AdminUser.findOne({ username });
        if (!admin)
            return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcryptjs_1.default.compare(password, admin.passwordHash);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });
        admin.lastLoginAt = new Date();
        await admin.save();
        const secret = process.env.JWT_SECRET || 'default-secret';
        const expiresIn = (process.env.JWT_EXPIRES_IN || '24h');
        const token = jsonwebtoken_1.default.sign({ adminId: admin._id.toString(), username: admin.username }, secret, { expiresIn });
        return res.json({ token, username: admin.username });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Login failed' });
    }
});
exports.adminRouter.use(auth_1.authMiddleware);
// PUT /api/admin/portal/dates
exports.adminRouter.put('/portal/dates', async (req, res) => {
    try {
        const { openingDate, closingDate } = req.body;
        if (!openingDate || !closingDate) {
            return res.status(400).json({ error: 'Opening date and closing date are required' });
        }
        const opening = new Date(openingDate);
        const closing = new Date(closingDate);
        if (isNaN(opening.getTime()) || isNaN(closing.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        if (closing <= opening) {
            return res.status(400).json({ error: 'Closing date must be after opening date' });
        }
        await models_1.PortalConfig.findOneAndUpdate({}, { openingDate: opening, closingDate: closing }, { upsert: true, new: true });
        return res.json({ message: 'Portal dates updated successfully' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update portal dates' });
    }
});
// PUT /api/admin/portal/status
exports.adminRouter.put('/portal/status', async (req, res) => {
    try {
        const { manualStatus } = req.body;
        const validStatuses = ['AUTO', 'COUNTDOWN', 'OPEN', 'CLOSED'];
        if (!validStatuses.includes(manualStatus)) {
            return res.status(400).json({ error: 'Invalid status. Must be AUTO, COUNTDOWN, OPEN, or CLOSED' });
        }
        const config = await models_1.PortalConfig.findOne();
        if (!config)
            return res.status(404).json({ error: 'Portal not configured' });
        config.manualStatus = manualStatus;
        await config.save();
        return res.json({ message: 'Portal status updated', manualStatus });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update portal status' });
    }
});
// POST /api/admin/slider/upload  — uploads to AWS S3
exports.adminRouter.post('/slider/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'Image file is required' });
        if (!(0, validation_1.validateImageFormat)(req.file.mimetype)) {
            return res.status(400).json({ error: 'Invalid file format. Only JPEG, PNG, and WebP are allowed.' });
        }
        const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
        const s3Key = `slider/${(0, uuid_1.v4)()}.${ext}`;
        const { url } = await (0, storage_1.uploadToS3)(s3Key, req.file.buffer, req.file.mimetype);
        const maxDoc = await models_1.SliderImage.findOne().sort({ displayOrder: -1 });
        const nextOrder = maxDoc ? maxDoc.displayOrder + 1 : 0;
        const image = await models_1.SliderImage.create({ imageUrl: url, s3Key, displayOrder: nextOrder });
        return res.status(201).json({
            message: 'Image uploaded',
            image: { id: image._id.toString(), imageUrl: image.imageUrl, displayOrder: image.displayOrder },
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to upload image' });
    }
});
// DELETE /api/admin/slider/:id
exports.adminRouter.delete('/slider/:id', async (req, res) => {
    try {
        const image = await models_1.SliderImage.findById(req.params.id);
        if (!image)
            return res.status(404).json({ error: 'Image not found' });
        // Delete from S3
        await (0, storage_1.deleteFromS3)(image.s3Key);
        await image.deleteOne();
        return res.json({ message: 'Image deleted' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete image' });
    }
});
// PUT /api/admin/slider/reorder
exports.adminRouter.put('/slider/reorder', async (req, res) => {
    try {
        const { order } = req.body;
        if (!Array.isArray(order)) {
            return res.status(400).json({ error: 'Order must be an array of { id, displayOrder }' });
        }
        for (const item of order) {
            await models_1.SliderImage.findByIdAndUpdate(item.id, { displayOrder: item.displayOrder });
        }
        return res.json({ message: 'Slider order updated' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to reorder slider images' });
    }
});
// POST /api/admin/results/upload
exports.adminRouter.post('/results/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'Result file is required' });
        const fileContent = req.file.buffer.toString('utf-8');
        let records;
        try {
            records = (0, sync_1.parse)(fileContent, { columns: true, skip_empty_lines: true, trim: true });
        }
        catch {
            return res.status(400).json({ error: 'Invalid CSV format' });
        }
        const invalidRolls = [];
        const validatedRecords = [];
        for (const record of records) {
            if (!record.rollNumber || !(0, rollNumber_1.isValidRollNumber)(record.rollNumber)) {
                invalidRolls.push(record.rollNumber || '(empty)');
                continue;
            }
            const participant = await models_1.Participant.findOne({
                rollNumber: record.rollNumber,
                paymentStatus: 'COMPLETED',
            });
            if (!participant) {
                invalidRolls.push(record.rollNumber);
            }
            else {
                validatedRecords.push({
                    rollNumber: record.rollNumber,
                    score: parseInt(record.score, 10) || 0,
                    rank: record.rank ? parseInt(record.rank, 10) : undefined,
                    remarks: record.remarks,
                    participantId: participant._id.toString(),
                });
            }
        }
        if (invalidRolls.length > 0) {
            return res.status(400).json({
                error: 'Validation failed: some roll numbers are invalid or not found',
                invalidRollNumbers: invalidRolls,
            });
        }
        for (const rec of validatedRecords) {
            await models_1.Result.findOneAndUpdate({ participantId: rec.participantId }, { rollNumber: rec.rollNumber, score: rec.score, rank: rec.rank, remarks: rec.remarks }, { upsert: true });
        }
        return res.json({ message: `${validatedRecords.length} results uploaded successfully` });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to upload results' });
    }
});
// PUT /api/admin/results/publish
exports.adminRouter.put('/results/publish', async (req, res) => {
    try {
        const pubDate = req.body.publicationDate ? new Date(req.body.publicationDate) : new Date();
        if (isNaN(pubDate.getTime())) {
            return res.status(400).json({ error: 'Invalid publication date' });
        }
        const config = await models_1.PortalConfig.findOne();
        if (!config)
            return res.status(404).json({ error: 'Portal not configured' });
        config.resultPublicationDate = pubDate;
        await config.save();
        await models_1.Result.updateMany({ publishedAt: { $exists: false } }, { $set: { publishedAt: pubDate } });
        return res.json({ message: 'Results publication date set', publicationDate: pubDate });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to set publication date' });
    }
});
// GET /api/admin/portal/fees
exports.adminRouter.get('/portal/fees', async (_req, res) => {
    try {
        const config = await models_1.PortalConfig.findOne().lean();
        return res.json({
            feeJunior: config?.feeJunior ?? 100,
            feeSenior: config?.feeSenior ?? 150,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to get fees' });
    }
});
// PUT /api/admin/portal/fees
exports.adminRouter.put('/portal/fees', async (req, res) => {
    try {
        const { feeJunior, feeSenior } = req.body;
        if (typeof feeJunior !== 'number' || typeof feeSenior !== 'number') {
            return res.status(400).json({ error: 'feeJunior and feeSenior must be numbers' });
        }
        if (feeJunior <= 0 || feeSenior <= 0) {
            return res.status(400).json({ error: 'Fees must be greater than 0' });
        }
        await models_1.PortalConfig.findOneAndUpdate({}, { feeJunior, feeSenior }, { upsert: true, new: true });
        return res.json({ message: 'Fees updated successfully', feeJunior, feeSenior });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update fees' });
    }
});
// GET /api/admin/portal/event-details
exports.adminRouter.get('/portal/event-details', async (_req, res) => {
    try {
        const config = await models_1.PortalConfig.findOne().lean();
        return res.json({
            eventDate: config?.eventDate,
            eventTime: config?.eventTime,
            venue: config?.venue,
            venueMapUrl: config?.venueMapUrl,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to get event details' });
    }
});
// PUT /api/admin/portal/event-details
exports.adminRouter.put('/portal/event-details', async (req, res) => {
    try {
        const { eventDate, eventTime, venue, venueMapUrl } = req.body;
        const updateData = {};
        if (eventDate) {
            const date = new Date(eventDate);
            if (isNaN(date.getTime())) {
                return res.status(400).json({ error: 'Invalid event date format' });
            }
            updateData.eventDate = date;
        }
        if (eventTime !== undefined)
            updateData.eventTime = eventTime;
        if (venue !== undefined)
            updateData.venue = venue;
        if (venueMapUrl !== undefined)
            updateData.venueMapUrl = venueMapUrl;
        await models_1.PortalConfig.findOneAndUpdate({}, updateData, { upsert: true, new: true });
        return res.json({ message: 'Event details updated successfully', ...updateData });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update event details' });
    }
});
// GET /api/admin/registrations
exports.adminRouter.get('/registrations', async (req, res) => {
    try {
        const { batch, search, page = '1', limit = '20', status } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, parseInt(limit, 10));
        const filter = {};
        if (batch && ['JUNIOR', 'SENIOR'].includes(batch)) {
            filter.batchType = batch;
        }
        if (status) {
            const statuses = status.split(',').filter(s => ['COMPLETED', 'PENDING', 'FAILED'].includes(s));
            if (statuses.length === 1) {
                filter.paymentStatus = statuses[0];
            }
            else if (statuses.length > 1) {
                filter.paymentStatus = { $in: statuses };
            }
        }
        if (search) {
            const s = search;
            filter.$or = [
                { name: { $regex: s, $options: 'i' } },
                { rollNumber: { $regex: s, $options: 'i' } },
                { mobileNumber: { $regex: s, $options: 'i' } },
                { guardianName: { $regex: s, $options: 'i' } },
                { email: { $regex: s, $options: 'i' } },
            ];
        }
        const [participants, total, juniorCount, seniorCount] = await Promise.all([
            models_1.Participant.find(filter)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            models_1.Participant.countDocuments(filter),
            models_1.Participant.countDocuments({ batchType: 'JUNIOR', paymentStatus: 'COMPLETED' }),
            models_1.Participant.countDocuments({ batchType: 'SENIOR', paymentStatus: 'COMPLETED' }),
        ]);
        return res.json({
            participants: participants.map((p) => ({
                id: p._id.toString(),
                rollNumber: p.rollNumber,
                name: p.name,
                class: p.class,
                batchType: p.batchType,
                guardianName: p.guardianName,
                address: p.address,
                mobileNumber: p.mobileNumber,
                email: p.email,
                photoUrl: p.photoUrl,
                paymentStatus: p.paymentStatus,
                groupInviteSent: p.groupInviteSent || false,
                admitCardDownloaded: p.admitCardDownloaded || false,
                createdAt: p.createdAt,
            })),
            total,
            page: pageNum,
            limit: limitNum,
            counts: { junior: juniorCount, senior: seniorCount },
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to get registrations' });
    }
});
// POST /api/admin/registrations/:id/send-group-invite
exports.adminRouter.post('/registrations/:id/send-group-invite', async (req, res) => {
    try {
        const participant = await models_1.Participant.findById(req.params.id);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        if (participant.groupInviteSent) {
            return res.status(409).json({ error: 'Group invite already sent to this participant' });
        }
        await (0, whatsapp_1.sendGroupInvite)(participant.mobileNumber);
        participant.groupInviteSent = true;
        await participant.save();
        return res.json({ message: 'Group invite sent successfully' });
    }
    catch (err) {
        console.error('[Admin] Failed to send group invite:', err);
        return res.status(500).json({ error: 'Failed to send group invite' });
    }
});
// POST /api/admin/registrations/:id/remind-admit-card
exports.adminRouter.post('/registrations/:id/remind-admit-card', async (req, res) => {
    try {
        const participant = await models_1.Participant.findById(req.params.id);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        if (participant.admitCardDownloaded) {
            return res.status(409).json({ error: 'Admit card already downloaded' });
        }
        // Check 24-hour cooldown
        if (participant.lastAdmitCardReminderAt) {
            const hoursSinceLast = (Date.now() - new Date(participant.lastAdmitCardReminderAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLast < 24) {
                const hoursLeft = Math.ceil(24 - hoursSinceLast);
                return res.status(429).json({ error: `Reminder already sent. Try again in ${hoursLeft}h.` });
            }
        }
        await (0, whatsapp_1.sendAdmitCardReminder)(participant.mobileNumber, participant.name);
        participant.lastAdmitCardReminderAt = new Date();
        await participant.save();
        return res.json({ message: 'Admit card reminder sent' });
    }
    catch (err) {
        console.error('[Admin] Failed to send admit card reminder:', err);
        return res.status(500).json({ error: 'Failed to send reminder' });
    }
});
//# sourceMappingURL=admin.js.map