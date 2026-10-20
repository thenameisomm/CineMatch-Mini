import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@shared/lib/api';
import { errorMessage } from '@features/auth/hooks/use-auth';
import { contentOf, type WatchlistItem } from '@shared/types';

const STATUSES = ['plan_to_watch', 'watching', 'completed', 'dropped', 'on_hold'] as const;

export function useWatchlist(status?: string) {
  return useQuery({
    queryKey: ['watchlist', status ?? 'all'],
    queryFn: async (): Promise<{ items: WatchlistItem[]; totalResults: number }> => {
      const { data } = await api.get('/watchlist', {
        params: { ...(status ? { status } : {}), limit: 50 },
      });
      return { items: data.data.items, totalResults: data.data.totalResults };
    },
  });
}

export function useUpdateWatchlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contentId: string; patch: Record<string, unknown> }) => {
      const { data } = await api.patch(`/watchlist/${input.contentId}`, input.patch);
      return data.data.item;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success('Watchlist updated');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Update failed')),
  });
}

export function useRemoveWatchlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => {
      await api.delete(`/watchlist/${contentId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success('Removed');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Remove failed')),
  });
}

export { STATUSES, contentOf };
