import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    adminId?: string;
    adminUsername?: string;
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map