import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
  userId: mongoose.Types.ObjectId;
  movieId: mongoose.Types.ObjectId;
  score: number; // 1–10 int
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    score: { type: Number, required: true, min: 1, max: 10, validate: Number.isInteger },
    review: { type: String, maxlength: 2000 },
  },
  { timestamps: true, collection: 'ratings' }
);

// DEMO: one rating per user per movie (upsert); index for movie stats.
RatingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
RatingSchema.index({ movieId: 1 });

export const RatingModel = mongoose.model<IRating>('Rating', RatingSchema);
export default RatingModel;
