import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { onPosterError, posterUrl } from '@shared/lib/tmdb-image';
import {
  STATUSES,
  contentOf,
  useRemoveWatchlistItem,
  useUpdateWatchlistItem,
  useWatchlist,
} from '@features/watchlist/hooks/use-watchlist';
import { yearOf } from '@shared/types';

const selectClass = 'rounded-md border border-input bg-background px-2 py-1 text-xs';

export function WatchlistPage() {
  const [status, setStatus] = useState<string>('');
  const { data, isLoading } = useWatchlist(status || undefined);
  const update = useUpdateWatchlistItem();
  const remove = useRemoveWatchlistItem();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">My watchlist</h1>
      <p className="mb-6 text-muted-foreground">{data?.totalResults ?? 0} titles saved.</p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant={!status ? 'default' : 'outline'} size="sm" onClick={() => setStatus('')}>
          All
        </Button>
        {STATUSES.map(s => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(s)}
          >
            {s.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="mb-4 text-muted-foreground">Nothing here yet.</p>
          <Button asChild>
            <Link to="/browse">Browse titles</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map(item => {
            const c = contentOf(item.contentId);
            if (!c) return null;
            return (
              <Card key={item._id}>
                <CardContent className="flex items-center gap-4 p-3">
                  <Link to={`/content/${c.type}/${c._id}`} className="w-12 shrink-0">
                    {posterUrl(c.posterPath) ? (
                      <img
                        src={posterUrl(c.posterPath)}
                        alt={c.title}
                        loading="lazy"
                        onError={onPosterError}
                        className="aspect-[2/3] w-full rounded object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] w-full items-center justify-center rounded bg-muted text-xs">
                        No art
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/content/${c.type}/${c._id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {c.title}{' '}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({yearOf(c)})
                      </span>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <select
                        className={selectClass}
                        value={item.status}
                        onChange={e =>
                          update.mutate({ contentId: c._id, patch: { status: e.target.value } })
                        }
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-muted-foreground">
                        Priority {item.priority}
                      </span>
                      <button
                        className="rounded p-1 hover:bg-accent"
                        title="Raise priority"
                        onClick={() =>
                          update.mutate({
                            contentId: c._id,
                            patch: { priority: Math.min(100, item.priority + 1) },
                          })
                        }
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="rounded p-1 hover:bg-accent"
                        title="Lower priority"
                        onClick={() =>
                          update.mutate({
                            contentId: c._id,
                            patch: { priority: Math.max(0, item.priority - 1) },
                          })
                        }
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove.mutate(c._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
