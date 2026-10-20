import type { IMovie } from '../../shared/database/models/Movie.js';

// Present Movie docs in the frontend `Content` shape so the existing
// React UI works unchanged.
export function toContent(doc: IMovie | Record<string, unknown>) {
  const d = doc as unknown as Record<string, unknown> & {
    _id: unknown;
    genres: { id: number; name: string }[];
    cast: { name: string; character?: string }[];
    releaseDate?: Date | string;
  };
  return {
    _id: String(d._id),
    tmdbId: (d.tmdbId as number) ?? 0,
    type: d.type,
    title: d.title,
    originalTitle: d.title,
    overview: d.overview,
    releaseDate: d.releaseDate ? new Date(d.releaseDate).toISOString() : undefined,
    runtime: d.runtime,
    genres: d.genres ?? [],
    keywords: d.keywords ?? [],
    cast: (d.cast ?? []).map((c, i) => ({ id: i + 1, name: c.name, character: c.character })),
    crew: d.director ? [{ id: 1, name: d.director, job: 'Director' }] : [],
    popularity: d.popularity ?? 0,
    voteAverage: d.voteAverage ?? 0,
    voteCount: d.voteCount ?? 0,
    posterPath: d.posterPath,
    backdropPath: d.backdropPath,
  };
}
