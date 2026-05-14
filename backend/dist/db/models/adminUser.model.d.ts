import { Document, Model } from 'mongoose';
export interface IAdminUser extends Document {
    username: string;
    passwordHash: string;
    email: string;
    createdAt: Date;
    lastLoginAt?: Date;
}
export declare const AdminUser: Model<IAdminUser>;
//# sourceMappingURL=adminUser.model.d.ts.map