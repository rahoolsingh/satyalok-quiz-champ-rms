"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionAuthMiddleware = sessionAuthMiddleware;
const sessionToken_1 = require("../services/sessionToken");
/**
 * Middleware that validates the session JWT from HTTP-only cookie or Authorization header.
 * Attaches req.verifiedMobile on success; returns 401 otherwise.
 */
function sessionAuthMiddleware(req, res, next) {
    // Try to get token from cookie first (preferred)
    let token = req.cookies?.sessionToken;
    // Fallback to Authorization header for backward compatibility
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }
    if (!token) {
        res.status(401).json({ error: 'Session token required' });
        return;
    }
    try {
        const payload = (0, sessionToken_1.verifySessionToken)(token);
        req.verifiedMobile = payload.sub;
        next();
    }
    catch {
        res.status(401).json({ error: 'Session expired or invalid. Please verify your mobile number again.' });
    }
}
//# sourceMappingURL=sessionAuth.js.map