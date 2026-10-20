import mongoose, { Document, Schema } from 'mongoose';

export interface IGenreRef {
  id: number;
  name: string;
}

export interface ICastRef {
  name: string;
  character?: string;
}

// One unified `movies` collection (type movie|tv), local seed data only.
export interface IMovie extends Document {
  tmdbId: number; // kept for compatibility with the original catalog (local ids ok)
  title: string;
  type: 'movie' | 'tv';
  overview: string;
  genres: IGenreRef[];
  keywords: string[];
  releaseDate?: Date;
  runtime?: number;
  language: string;
  popularity: number;
  voteAverage: number;
  voteCount: number;
  posterPath?: string;
  backdropPath?: string;
  cast: ICastRef[];
  director?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GenreRefSchema = new Schema<IGenreRef>(
  { id: { type: Number, required: true }, name: { type: String, required: true } },
  { _id: false }
);

const CastRefSchema = new Schema<ICastRef>(
  { name: { type: String, required: true }, character: { type: String } },
  { _id: false }
);

const MovieSchema = new Schema<IMovie>(
  {
    tmdbId: { type: Number, default: 0, index: true },
    title: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ['movie', 'tv'], default: 'movie', index: true },
    overview: { type: String, default: '' },
    genres: { type: [GenreRefSchema], default: [] },
    keywords: { type: [String], default: [] },
    releaseDate: { type: Date },
    runtime: { type: Number, min: 0 },
    language: { type: String, default: 'en' },
    popularity: { type: Number, default: 0 },
    voteAverage: { type: Number, default: 0, min: 0, max: 10 },
    voteCount: { type: Number, default: 0, min: 0 },
    posterPath: { type: String },
    backdropPath: { type: String },
    cast: { type: [CastRefSchema], default: [] },
    director: { type: String },
  },
  { timestamps: true, collection: 'movies' }
);

// DEMO indexes: text search (title+overview), genre filter, sorting.
MovieSchema.index({ title: 'text', overview: 'text' }, { name: 'movie_text_search' });
MovieSchema.index({ 'genres.id': 1 });
MovieSchema.index({ voteAverage: -1 });
MovieSchema.index({ popularity: -1 });
MovieSchema.index({ releaseDate: -1 });

export const MovieModel = mongoose.model<IMovie>('Movie', MovieSchema);
export default MovieModel;
