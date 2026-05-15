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
exports.Participant = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ParticipantSchema = new mongoose_1.Schema({
    rollNumber: { type: String },
    name: { type: String, required: true },
    class: { type: String, required: true },
    batchType: { type: String, enum: ['JUNIOR', 'SENIOR'], required: true },
    guardianName: { type: String, required: true },
    address: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String },
    referralSource: { type: String },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING',
    },
    paymentId: { type: String },
    admitCardUrl: { type: String },
    merchantTransactionId: { type: String },
    photoUrl: { type: String },
    otpVerifiedAt: { type: Date },
    thankYouMessageSent: { type: Boolean, default: false },
    paymentReminderSent: { type: Boolean, default: false },
    groupInviteSent: { type: Boolean, default: false },
    admitCardDownloaded: { type: Boolean, default: false },
    lastAdmitCardReminderAt: { type: Date },
}, { timestamps: true });
ParticipantSchema.index({ mobileNumber: 1 });
ParticipantSchema.index({ merchantTransactionId: 1 }, { unique: true, sparse: true });
ParticipantSchema.index({ batchType: 1 });
ParticipantSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });
exports.Participant = mongoose_1.default.models.Participant || mongoose_1.default.model('Participant', ParticipantSchema);
//# sourceMappingURL=participant.model.js.map