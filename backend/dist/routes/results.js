"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultsRouter = void 0;
const express_1 = require("express");
const models_1 = require("../db/models");
const portalState_1 = require("../services/portalState");
const rollNumber_1 = require("../services/rollNumber");
exports.resultsRouter = (0, express_1.Router)();
// GET /api/results/:rollNumber
exports.resultsRouter.get('/:rollNumber', async (req, res) => {
    try {
        const { rollNumber } = req.params;
        if (!(0, rollNumber_1.isValidRollNumber)(rollNumber)) {
            return res.status(400).json({ error: 'Invalid roll number format. Must be 5 digits.' });
        }
        const config = await (0, portalState_1.getPortalConfig)();
        if (!config || !(0, portalState_1.areResultsPublished)(config)) {
            return res.status(403).json({ error: 'Results have not been published yet. Please check back later.' });
        }
        const result = await models_1.Result.findOne({ rollNumber }).populate('participantId', 'name class batchType');
        if (!result) {
            return res.status(404).json({ error: 'No result found for this roll number.' });
        }
        const p = result.participantId;
        return res.json({
            rollNumber: result.rollNumber,
            name: p.name,
            class: p.class,
            batchType: p.batchType,
            score: result.score,
            rank: result.rank,
            remarks: result.remarks,
            publishedAt: result.publishedAt,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to retrieve result' });
    }
});
//# sourceMappingURL=results.js.map