import mongoose, { Document, Model } from 'mongoose';
export interface IResult extends Document {
    participantId: mongoose.Types.ObjectId;
    rollNumber: string;
    score: number;
    rank?: number;
    remarks?: string;
    publishedAt?: Date;
    createdAt: Date;
}
export declare const Result: Model<IResult>;
//# sourceMappingURL=result.model.d.ts.map