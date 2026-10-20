import mongoose, { Document, Schema } from 'mongoose';

export type WatchlistStatus = 'plan_to_watch' | 'watching' | 'completed' | 'dropped' | 'on_hold';

export interface IWatchlistItem extends Document {
  userId: mongoose.Types.ObjectId;
  movieId: mongoose.Types.ObjectId;
  status: WatchlistStatus;
  priority: number;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const WatchlistItemSchema = new Schema<IWatchlistItem>(
  {
    // DEMO: references — watchlist references users + movies.
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    status: {
      type: String,
      enum: ['plan_to_watch', 'watching', 'completed', 'dropped', 'on_hold'],
      default: 'plan_to_watch',
    },
    priority: { type: Number, default: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true, collection: 'watchlist' }
);

// DEMO: unique compound index prevents duplicates; compound index for filtering.
WatchlistItemSchema.index({ userId: 1, movieId: 1 }, { unique: true });
WatchlistItemSchema.index({ userId: 1, status: 1 });

export const WatchlistItemModel = mongoose.model<IWatchlistItem>(
  'WatchlistItem',
  WatchlistItemSchema
);
export default WatchlistItemModel;
