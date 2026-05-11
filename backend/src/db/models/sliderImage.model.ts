import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISliderImage extends Document {
  imageUrl: string;
  s3Key: string;
  displayOrder: number;
  createdAt: Date;
}

const SliderImageSchema = new Schema<ISliderImage>(
  {
    imageUrl: { type: String, required: true },
    s3Key: { type: String, required: true },
    displayOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export const SliderImage: Model<ISliderImage> =
  mongoose.models.SliderImage || mongoose.model<ISliderImage>('SliderImage', SliderImageSchema);
