import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@shared/lib/api';
import { errorMessage } from '@features/auth/hooks/use-auth';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { contentOf, type Rating } from '@shared/types';
import { onPosterError, posterUrl } from '@shared/lib/tmdb-image';

export function RatingsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const { data: summary } = useQuery({
    queryKey: ['ratings', 'summary'],
    queryFn: async () =>
      (await api.get('/ratings/summary')).data.data as { count: number; avgScore: number },
  });
  const { data, isLoading } = useQuery({
    queryKey: ['ratings', 'mine'],
    queryFn: async () =>
      (await api.get('/ratings', { params: { limit: 50 } })).data.data as { items: Rating[] },
  });

  const save = useMutation({
    mutationFn: async (input: { contentId: string; score: number }) => {
      await api.post('/ratings', input);
    },
    onSuccess: () => {
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['ratings'] });
      toast.success('Rating updated');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Save failed')),
  });

  const remove = useMutation({
    mutationFn: async (contentId: string) => {
      await api.delete(`/ratings/${contentId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ratings'] });
      toast.success('Rating removed');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Remove failed')),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">My ratings</h1>
      <p className="mb-6 text-muted-foreground">
        {summary ? `${summary.count} rated · average ${summary.avgScore}/10` : 'Loading…'}
      </p>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="mb-4 text-muted-foreground">You haven&apos;t rated anything yet.</p>
          <Button asChild>
            <Link to="/browse">Find something to rate</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map(r => {
            const c = contentOf(r.contentId);
            if (!c) return null;
            return (
              <Card key={r._id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Link
                    to={`/content/${c.type}/${c._id}`}
                    className="w-12 shrink-0"
                    aria-label={c.title}
                  >
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-lg font-bold text-black">
                    {editing === c._id && score ? score : r.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/content/${c.type}/${c._id}`}
                      className="font-medium hover:underline"
                    >
                      {c.title}
                    </Link>
                    {r.review && editing !== c._id && (
                      <p className="truncate text-sm text-muted-foreground">“{r.review}”</p>
                    )}
                    {editing === c._id && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <button
                            key={n}
                            onClick={() => setScore(n)}
                            className={`h-7 w-7 rounded text-xs ${n <= score ? 'bg-amber-400 text-black' : 'bg-muted'}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {editing === c._id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!score}
                        onClick={() => save.mutate({ contentId: c._id, score })}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(c._id);
                          setScore(r.score);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove.mutate(c._id)}>
                        Remove
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
