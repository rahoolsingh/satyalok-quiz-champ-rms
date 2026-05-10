import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../services/sessionToken';

export interface SessionRequest extends Request {
  verifiedMobile?: string;
}

/**
 * Middleware that validates the short-lived OTP session JWT.
 * Attaches req.verifiedMobile on success; returns 401 otherwise.
 */
export function sessionAuthMiddleware(
  req: SessionRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Session token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifySessionToken(token);
    req.verifiedMobile = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please verify your mobile number again.' });
  }
}
