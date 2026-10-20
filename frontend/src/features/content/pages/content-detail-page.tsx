import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@shared/lib/api';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import { ContentGrid } from '@shared/components/content-grid';
import { backdropUrl, onPosterError, posterUrl } from '@shared/lib/tmdb-image';
import { useCurrentUser } from '@features/auth/hooks/use-auth';
import {
  useContentDetail,
  useMyRating,
  useSimilar,
  useSubmitRating,
  useToggleWatchlist,
  useWatchlistStatus,
} from '@features/content/hooks/use-content';
import { yearOf } from '@shared/types';

function RatingWidget({ contentId }: { contentId: string }) {
  const { data: mine, isLoading } = useMyRating(contentId);
  const submit = useSubmitRating(contentId);
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');

  const active = score || mine?.score || 0;
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <h3 className="font-semibold">Your rating {mine ? `· ${mine.score}/10` : ''}</h3>
        {isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <button
                key={n}
                onClick={() => setScore(n)}
                className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium ${
                  n <= active
                    ? 'bg-amber-400 text-black'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
                aria-label={`Rate ${n} out of 10`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={2}
          placeholder="Short review (optional)…"
          value={review}
          onChange={e => setReview(e.target.value)}
        />
        <Button
          size="sm"
          disabled={!active || submit.isPending}
          onClick={() => submit.mutate({ score: active, review: review || undefined })}
        >
          <Star className="mr-1 h-3 w-3" /> {mine ? 'Update rating' : 'Rate'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ContentDetailPage() {
  const { id } = useParams();
  const { data: content, isLoading, isError } = useContentDetail(id);
  const { data: similar } = useSimilar(id);
  const { data: user } = useCurrentUser();
  const watchlist = useWatchlistStatus(user && id ? id : undefined);
  const toggle = useToggleWatchlist(id ?? '');

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (isError || !content) {
    return <div className="container mx-auto px-4 py-16 text-center">Title not found.</div>;
  }

  const backdrop = backdropUrl(content.backdropPath);
  const poster = posterUrl(content.posterPath, 'w500');
  const inWatchlist = watchlist.data?.inWatchlist ?? false;

  return (
    <div>
      {backdrop && (
        <div className="relative h-64 overflow-hidden md:h-96">
          <img
            src={backdrop}
            alt=""
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}
      <div className="container mx-auto px-4 pb-12">
        <div
          className={`flex flex-col gap-6 md:flex-row ${backdrop ? '-mt-24 md:-mt-32' : 'mt-6'}`}
        >
          <div className="w-40 shrink-0 overflow-hidden rounded-lg border shadow-lg md:w-56">
            {poster ? (
              <img
                src={poster}
                alt={content.title}
                onError={onPosterError}
                className="aspect-[2/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted p-4 text-center text-sm">
                {content.title}
              </div>
            )}
          </div>
          <div className={`flex-1 pt-2 ${backdrop ? 'md:pt-28' : ''}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge>{content.type}</Badge>
              <span>{yearOf(content)}</span>
              {content.runtime ? <span>· {content.runtime} min</span> : null}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />{' '}
                {content.voteAverage?.toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  ({content.voteCount?.toLocaleString()} votes)
                </span>
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">{content.title}</h1>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {content.genres?.map(g => (
                <Badge key={g.id} variant="secondary">
                  {g.name}
                </Badge>
              ))}
            </div>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
              {content.overview || 'No overview available.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user ? (
                <>
                  <Button onClick={() => toggle.mutate(inWatchlist)} disabled={toggle.isPending}>
                    {inWatchlist ? (
                      <BookmarkCheck className="mr-2 h-4 w-4" />
                    ) : (
                      <Bookmark className="mr-2 h-4 w-4" />
                    )}
                    {inWatchlist
                      ? `In watchlist (${(watchlist.data?.item?.status ?? '').replace(/_/g, ' ')})`
                      : 'Add to watchlist'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void api
                        .post('/history', { contentId: content._id, progress: 100 })
                        .then(() => toast.success('Marked as watched'));
                    }}
                  >
                    Mark as watched
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Log in to add this to your watchlist or rate it.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {content.cast && content.cast.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">Top cast</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {content.cast.slice(0, 6).map(c => (
                    <div key={c.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{c.name}</p>
                      {c.character && <p className="text-muted-foreground">{c.character}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section>
              <h2 className="mb-3 text-xl font-semibold">More like this</h2>
              <ContentGrid
                items={(similar ?? []).map(s => s.content)}
                isLoading={false}
                reasons={new Map((similar ?? []).map(s => [s.content._id, s.reason]))}
                emptyMessage="No similar titles yet."
              />
            </section>
          </div>
          <div className="space-y-6">
            {user && id && <RatingWidget contentId={id} />}
            {content.keywords && content.keywords.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-2 font-semibold">Keywords</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {content.keywords.slice(0, 12).map(k => (
                      <Badge key={k} variant="outline">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
