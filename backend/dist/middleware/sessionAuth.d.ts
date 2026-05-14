import { Request, Response, NextFunction } from 'express';
export interface SessionRequest extends Request {
    verifiedMobile?: string;
}
/**
 * Middleware that validates the session JWT from HTTP-only cookie or Authorization header.
 * Attaches req.verifiedMobile on success; returns 401 otherwise.
 */
export declare function sessionAuthMiddleware(req: SessionRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=sessionAuth.d.ts.map