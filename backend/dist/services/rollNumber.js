"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRollNumber = generateRollNumber;
exports.generateUniqueRollNumber = generateUniqueRollNumber;
exports.isValidRollNumber = isValidRollNumber;
const models_1 = require("../db/models");
function generateRollNumber() {
    const num = Math.floor(Math.random() * 90000) + 10000;
    return String(num);
}
async function generateUniqueRollNumber(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        const rollNumber = generateRollNumber();
        const existing = await models_1.Participant.findOne({ rollNumber });
        if (!existing)
            return rollNumber;
    }
    throw new Error('Failed to generate unique roll number after maximum attempts');
}
function isValidRollNumber(rollNumber) {
    return /^\d{5}$/.test(rollNumber);
}
//# sourceMappingURL=rollNumber.js.map