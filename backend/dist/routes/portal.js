"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalRouter = void 0;
const express_1 = require("express");
const portalState_1 = require("../services/portalState");
const models_1 = require("../db/models");
exports.portalRouter = (0, express_1.Router)();
// GET /api/portal/status
exports.portalRouter.get('/status', async (_req, res) => {
    try {
        const config = await (0, portalState_1.getPortalConfig)();
        if (!config) {
            return res.status(503).json({ error: 'Portal not configured' });
        }
        const state = (0, portalState_1.computePortalState)(config);
        const resultsPublished = (0, portalState_1.areResultsPublished)(config);
        return res.json({
            state,
            openingDate: config.openingDate,
            closingDate: config.closingDate,
            resultsPublished,
            resultPublicationDate: config.resultPublicationDate,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to get portal status' });
    }
});
// GET /api/portal/slider-images
exports.portalRouter.get('/slider-images', async (_req, res) => {
    try {
        const images = await models_1.SliderImage.find().sort({ displayOrder: 1 });
        return res.json(images.map((img) => ({
            id: img._id.toString(),
            imageUrl: img.imageUrl,
            displayOrder: img.displayOrder,
            createdAt: img.createdAt,
        })));
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to get slider images' });
    }
});
//# sourceMappingURL=portal.js.map