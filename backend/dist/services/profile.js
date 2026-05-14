"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.checkDuplicateRegistration = checkDuplicateRegistration;
const models_1 = require("../db/models");
const admitCard_1 = require("./admitCard");
/**
 * Get complete profile data for a user by mobile number
 */
async function getProfile(mobileNumber) {
    const participant = await models_1.Participant.findOne({ mobileNumber })
        .sort({ createdAt: -1 })
        .lean();
    if (!participant) {
        return null;
    }
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
        rollNumber: participant.rollNumber,
        merchantTransactionId: participant.merchantTransactionId,
        registeredAt: participant.createdAt,
    };
    // Include admit card data if payment is completed AND roll number exists
    if (participant.paymentStatus === 'COMPLETED' && participant.rollNumber) {
        // Fetch event details from portal config
        const portalConfig = await models_1.PortalConfig.findOne().lean();
        const eventDate = portalConfig?.eventDate
            ? new Date(portalConfig.eventDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })
            : undefined;
        profile.admitCard = (0, admitCard_1.generateAdmitCardData)({
            id: participant._id.toString(),
            rollNumber: participant.rollNumber,
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
        }, {
            eventDate,
            eventTime: portalConfig?.eventTime,
            venue: portalConfig?.venue,
            venueMapUrl: portalConfig?.venueMapUrl,
        });
    }
    return profile;
}
/**
 * Check if a mobile number already has a registration
 */
async function checkDuplicateRegistration(mobileNumber) {
    const participant = await models_1.Participant.findOne({ mobileNumber })
        .sort({ createdAt: -1 })
        .lean();
    if (!participant) {
        return { exists: false };
    }
    return {
        exists: true,
        status: participant.paymentStatus,
        participantId: participant._id.toString(),
    };
}
//# sourceMappingURL=profile.js.map