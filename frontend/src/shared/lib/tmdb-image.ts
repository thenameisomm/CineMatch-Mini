import type { SyntheticEvent } from 'react';

const IMAGE_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

/** Local fallback shown when a movie has no poster or its image fails to load.
 *  It states that the poster is unavailable instead of showing a wrong image. */
export const POSTER_FALLBACK = '/poster-placeholder.svg';

export function posterUrl(
  path: string | undefined,
  size: 'w342' | 'w500' | 'original' = 'w342'
): string | undefined {
  return path ? `${IMAGE_BASE}/${size}${path}` : undefined;
}

export function backdropUrl(
  path: string | undefined,
  size: 'w780' | 'w1280' | 'original' = 'w1280'
): string | undefined {
  return path ? `${IMAGE_BASE}/${size}${path}` : undefined;
}

/**
 * Shared <img> onError handler: swaps a broken poster for the local
 * placeholder exactly once (the data attribute guard prevents error loops
 * if the fallback itself ever failed).
 */
export function onPosterError(e: SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = 'true';
  img.src = POSTER_FALLBACK;
}
