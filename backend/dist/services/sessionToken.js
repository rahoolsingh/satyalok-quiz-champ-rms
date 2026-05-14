"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signSessionToken = signSessionToken;
exports.verifySessionToken = verifySessionToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SESSION_EXPIRY_SECONDS = 30 * 60; // 30 minutes
function getSecret() {
    const secret = process.env.SESSION_JWT_SECRET;
    if (!secret)
        throw new Error('SESSION_JWT_SECRET environment variable is not set');
    return secret;
}
/**
 * Signs a short-lived JWT session token for a verified mobile number.
 */
function signSessionToken(mobileNumber) {
    return jsonwebtoken_1.default.sign({ sub: mobileNumber }, getSecret(), {
        expiresIn: SESSION_EXPIRY_SECONDS,
    });
}
/**
 * Verifies a session token and returns the payload.
 * Throws if the token is invalid or expired.
 */
function verifySessionToken(token) {
    return jsonwebtoken_1.default.verify(token, getSecret());
}
//# sourceMappingURL=sessionToken.js.map