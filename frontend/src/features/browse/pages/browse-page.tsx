import { useSearchParams } from 'react-router-dom';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { ContentGrid } from '@shared/components/content-grid';
import { Pagination } from '@shared/components/pagination';
import { useBrowseContent, useGenres } from '@features/browse/hooks/use-browse';
import type { BrowseFilters } from '@features/browse/hooks/use-browse';

function paramsToFilters(params: URLSearchParams): BrowseFilters {
  return {
    page: Number(params.get('page') ?? 1) || 1,
    type: params.get('type') ?? undefined,
    genre: params.get('genre') ?? undefined,
    year: params.get('year') ?? undefined,
    minRating: params.get('minRating') ?? undefined,
    sort: params.get('sort') ?? 'popularity',
    order: params.get('order') ?? 'desc',
  };
}

const selectClass = 'rounded-md border border-input bg-background px-3 py-2 text-sm';

export function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const filters = paramsToFilters(params);
  const { data, isLoading, isError } = useBrowseContent(filters);
  const { data: genres } = useGenres();

  const set = (patch: Partial<BrowseFilters>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    }
    // Any filter change resets to page 1; explicit page changes are kept.
    if (patch.page === undefined) next.delete('page');
    setParams(next);
  };
  const clear = () => setParams({});

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Browse</h1>
      <p className="mb-6 text-muted-foreground">
        Filters sync to the URL — share the link with anyone.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
        <select
          className={selectClass}
          value={filters.type ?? ''}
          onChange={e => set({ type: e.target.value || undefined })}
        >
          <option value="">Movies + TV</option>
          <option value="movie">Movies</option>
          <option value="tv">TV shows</option>
        </select>
        <select
          className={selectClass}
          value={filters.genre ?? ''}
          onChange={e => set({ genre: e.target.value || undefined })}
        >
          <option value="">All genres</option>
          {(genres ?? []).map(g => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.count})
            </option>
          ))}
        </select>
        <Input
          className="w-28"
          placeholder="Year"
          value={filters.year ?? ''}
          onChange={e => set({ year: e.target.value || undefined })}
        />
        <select
          className={selectClass}
          value={filters.minRating ?? ''}
          onChange={e => set({ minRating: e.target.value || undefined })}
        >
          <option value="">Any rating</option>
          <option value="7">7+</option>
          <option value="8">8+</option>
          <option value="9">9+</option>
        </select>
        <select
          className={selectClass}
          value={filters.sort}
          onChange={e => set({ sort: e.target.value })}
        >
          <option value="popularity">Popularity</option>
          <option value="vote_average">Rating</option>
          <option value="release_date">Release date</option>
          <option value="title">Title</option>
          <option value="runtime">Runtime</option>
        </select>
        <select
          className={selectClass}
          value={filters.order}
          onChange={e => set({ order: e.target.value })}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <Button variant="ghost" onClick={clear}>
          Clear
        </Button>
      </div>

      {isError ? (
        <p className="py-16 text-center text-destructive">
          Failed to load content. Is the backend running?
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {data ? `${data.totalResults} titles` : 'Loading…'}
          </p>
          <ContentGrid items={data?.items ?? []} isLoading={isLoading} />
          <Pagination
            page={filters.page}
            totalPages={data?.totalPages ?? 0}
            onChange={page => set({ page })}
          />
        </>
      )}
    </div>
  );
}
