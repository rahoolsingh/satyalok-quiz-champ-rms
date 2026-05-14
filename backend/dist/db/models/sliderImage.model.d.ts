import { Document, Model } from 'mongoose';
export interface ISliderImage extends Document {
    imageUrl: string;
    s3Key: string;
    displayOrder: number;
    createdAt: Date;
}
export declare const SliderImage: Model<ISliderImage>;
//# sourceMappingURL=sliderImage.model.d.ts.map