import { describe, expect, it, vi } from 'vitest';
import type { SyntheticEvent } from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContentCard } from '@shared/components/content-card';
import { ContentGrid } from '@shared/components/content-grid';
import { POSTER_FALLBACK, onPosterError, posterUrl } from '@shared/lib/tmdb-image';
import { isAuthRequest, shouldRedirectToLogin } from '@shared/lib/api';
import type { Content } from '@shared/types';

const sample: Content = {
  _id: 'abc123',
  tmdbId: 157336,
  type: 'movie',
  title: 'Interstellar',
  releaseDate: '2014-11-07',
  genres: [{ id: 878, name: 'Science Fiction' }],
  keywords: [],
  cast: [],
  crew: [],
  popularity: 95,
  voteAverage: 8.7,
  voteCount: 1000,
  posterPath: '/x.jpg',
};

describe('tmdb-image', () => {
  it('builds poster urls and handles missing paths', () => {
    expect(posterUrl('/x.jpg')).toBe('https://image.tmdb.org/t/p/w342/x.jpg');
    expect(posterUrl(undefined)).toBeUndefined();
  });

  it('swaps a broken poster for the local placeholder exactly once', () => {
    const img = document.createElement('img');
    img.src = 'https://image.tmdb.org/t/p/w342/broken.jpg';
    onPosterError({
      currentTarget: img,
    } as unknown as SyntheticEvent<HTMLImageElement>);
    expect(img.src).toContain(POSTER_FALLBACK);
    // Second error (e.g. placeholder itself failing) must not loop.
    const setSrc = vi.spyOn(img, 'src', 'set');
    onPosterError({
      currentTarget: img,
    } as unknown as SyntheticEvent<HTMLImageElement>);
    expect(setSrc).not.toHaveBeenCalled();
  });
});

describe('ContentCard', () => {
  it('renders title, rating, and links to the detail page', () => {
    render(
      <MemoryRouter>
        <ContentCard content={sample} reason="Shares Science Fiction" />
      </MemoryRouter>
    );
    expect(screen.getByText('Interstellar')).toBeInTheDocument();
    expect(screen.getByText('8.7')).toBeInTheDocument();
    expect(screen.getByText('Shares Science Fiction')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/content/movie/abc123');
  });
});

describe('auth interceptor guards (regression: reload loop)', () => {
  it('treats auth endpoints as self-managed', () => {
    expect(isAuthRequest('/auth/refresh')).toBe(true);
    expect(isAuthRequest('/auth/login')).toBe(true);
    expect(isAuthRequest('/auth/register')).toBe(true);
    expect(isAuthRequest('/content')).toBe(false);
    expect(isAuthRequest(undefined)).toBe(false);
  });

  it('never redirects to login from an auth page', () => {
    expect(shouldRedirectToLogin('/auth/login')).toBe(false);
    expect(shouldRedirectToLogin('/auth/register')).toBe(false);
    expect(shouldRedirectToLogin('/browse')).toBe(true);
    expect(shouldRedirectToLogin('/')).toBe(true);
  });
});
describe('ContentGrid', () => {
  it('shows an empty state when there are no items', () => {
    render(
      <MemoryRouter>
        <ContentGrid items={[]} isLoading={false} />
      </MemoryRouter>
    );
    expect(screen.getByText(/No titles found/)).toBeInTheDocument();
  });
});
