import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@shared/lib/api';
import { errorMessage, useCurrentUser, useLogout } from '@features/auth/hooks/use-auth';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';

export function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [initialized, setInitialized] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['users', 'stats'],
    queryFn: async () =>
      (await api.get('/users/me/stats')).data.data as {
        watchlistCount: number;
        ratingsCount: number;
        historyEntries: number;
        watchTimeMinutes: number;
      },
    enabled: Boolean(user),
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/users/me', {
        displayName: displayName || undefined,
        bio: bio || undefined,
      });
      return data.data.user;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Profile updated');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Update failed')),
  });

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!user) return <div className="container mx-auto px-4 py-16 text-center">Please log in.</div>;
  if (!initialized) {
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setInitialized(true);
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Profile</h1>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Watchlist', value: stats?.watchlistCount ?? 0 },
          { label: 'Ratings', value: stats?.ratingsCount ?? 0 },
          { label: 'Watch time', value: `${Math.round((stats?.watchTimeMinutes ?? 0) / 60)}h` },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="displayName">
              Display name
            </label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="bio">
              Bio
            </label>
            <Input
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about your taste…"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              Save changes
            </Button>
            <Button variant="outline" onClick={() => logout.mutate()}>
              Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
