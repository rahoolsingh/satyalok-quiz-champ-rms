"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PGSError = void 0;
exports.initiatePhonePePayment = initiatePhonePePayment;
exports.verifyPhonePePayment = verifyPhonePePayment;
const axios_1 = __importDefault(require("axios"));
// ─── Axios instance ───────────────────────────────────────────────────────────
function getPgsAxios() {
    const baseURL = process.env.PGS_BASE_URL;
    const apiKey = process.env.PGS_API_KEY;
    if (!baseURL)
        throw new Error('PGS_BASE_URL environment variable is not set');
    if (!apiKey)
        throw new Error('PGS_API_KEY environment variable is not set');
    return axios_1.default.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        timeout: 15000,
    });
}
// ─── Public functions ─────────────────────────────────────────────────────────
/**
 * Calls POST /quizChampOrderS2S on the PGS.
 * Returns the PhonePe redirect URL and the merchantTransactionId.
 * Throws on any non-2xx response.
 */
async function initiatePhonePePayment(order) {
    const pgs = getPgsAxios();
    try {
        const res = await pgs.post('/quizChampOrderS2S', order);
        return res.data;
    }
    catch (err) {
        const axiosErr = err;
        const status = axiosErr.response?.status;
        const message = axiosErr.response?.data?.message || axiosErr.message;
        throw new PGSError(`PGS order initiation failed (${status}): ${message}`, status);
    }
}
/**
 * Calls GET /quizChampStatusS2S?id={merchantTransactionId} on the PGS.
 * Returns the payment status.
 * Throws on any non-2xx response.
 */
async function verifyPhonePePayment(merchantTransactionId) {
    const pgs = getPgsAxios();
    try {
        const res = await pgs.get('/quizChampStatusS2S', {
            params: { id: merchantTransactionId },
        });
        return res.data;
    }
    catch (err) {
        const axiosErr = err;
        const status = axiosErr.response?.status;
        const message = axiosErr.response?.data?.message || axiosErr.message;
        throw new PGSError(`PGS status check failed (${status}): ${message}`, status);
    }
}
// ─── Custom error ─────────────────────────────────────────────────────────────
class PGSError extends Error {
    constructor(message, httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
        this.name = 'PGSError';
    }
}
exports.PGSError = PGSError;
//# sourceMappingURL=pgsClient.js.map