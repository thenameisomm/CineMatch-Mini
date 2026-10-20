export interface Genre {
  id: number;
  name: string;
}

export interface Content {
  _id: string;
  tmdbId: number;
  type: 'movie' | 'tv';
  title: string;
  originalTitle?: string;
  overview?: string;
  releaseDate?: string;
  runtime?: number;
  genres: Genre[];
  keywords: string[];
  cast: { id: number; name: string; character?: string; profilePath?: string; order?: number }[];
  crew: { id: number; name: string; job: string }[];
  popularity: number;
  voteAverage: number;
  voteCount: number;
  posterPath?: string;
  backdropPath?: string;
  externalIds?: { imdbId?: string };
}

export interface Paginated<T> {
  items: T[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  preferences: {
    favoriteGenres?: number[];
    preferredLanguages?: string[];
    contentTypes?: ('movie' | 'tv')[];
    maturityRating?: string;
  };
  stats: { watchlistCount: number; ratingsCount: number; watchTimeMinutes: number };
}

export interface WatchlistItem {
  _id: string;
  userId: string;
  contentId: Content | string;
  status: 'plan_to_watch' | 'watching' | 'completed' | 'dropped' | 'on_hold';
  priority: number;
  progress: number;
}

export interface Rating {
  _id: string;
  contentId: Content | string;
  score: number;
  review?: string;
  isPublic: boolean;
  updatedAt: string;
}

export function contentOf(ref: Content | string | undefined): Content | undefined {
  return typeof ref === 'object' ? ref : undefined;
}

export function yearOf(c: Content): string {
  return c.releaseDate ? new Date(c.releaseDate).getFullYear().toString() : '—';
}
