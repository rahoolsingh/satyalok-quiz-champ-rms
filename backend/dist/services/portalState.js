"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePortalState = computePortalState;
exports.areResultsPublished = areResultsPublished;
exports.getPortalConfig = getPortalConfig;
const models_1 = require("../db/models");
function computePortalState(config, now = new Date()) {
    if (config.manualStatus !== 'AUTO') {
        switch (config.manualStatus) {
            case 'COUNTDOWN': return 'COUNTDOWN';
            case 'OPEN': return 'OPEN';
            case 'CLOSED': return 'CLOSED';
        }
    }
    if (now < config.openingDate)
        return 'COUNTDOWN';
    if (now >= config.openingDate && now <= config.closingDate)
        return 'OPEN';
    return 'CLOSED';
}
function areResultsPublished(config, now = new Date()) {
    if (!config.resultPublicationDate)
        return false;
    return now >= config.resultPublicationDate;
}
async function getPortalConfig() {
    const doc = await models_1.PortalConfig.findOne().sort({ createdAt: -1 });
    if (!doc)
        return null;
    return {
        id: doc._id.toString(),
        openingDate: doc.openingDate,
        closingDate: doc.closingDate,
        manualStatus: doc.manualStatus,
        resultPublicationDate: doc.resultPublicationDate,
        feeJunior: doc.feeJunior ?? 100,
        feeSenior: doc.feeSenior ?? 150,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
//# sourceMappingURL=portalState.js.map