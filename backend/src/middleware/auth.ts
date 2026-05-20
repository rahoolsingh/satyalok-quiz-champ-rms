import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminSession } from '../db/models';

export interface AuthRequest extends Request {
  adminId?: string;
  adminUsername?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { adminId: string; username: string };
    req.adminId = decoded.adminId;
    req.adminUsername = decoded.username;

    // Update session lastActiveAt (fire and forget)
    AdminSession.findOneAndUpdate(
      { token, isActive: true },
      { lastActiveAt: new Date() }
    ).exec().catch(() => {});

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
