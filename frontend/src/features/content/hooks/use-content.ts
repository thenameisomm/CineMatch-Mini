import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@shared/lib/api';
import { errorMessage } from '@features/auth/hooks/use-auth';
import type { Content } from '@shared/types';

export function useContentDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['content', 'detail', id],
    queryFn: async (): Promise<Content> => {
      const { data } = await api.get(`/content/${id}`);
      return data.data.content as Content;
    },
    enabled: Boolean(id),
  });
}

export function useSimilar(id: string | undefined) {
  return useQuery({
    queryKey: ['content', 'similar', id],
    queryFn: async (): Promise<{ content: Content; score: number; reason: string }[]> => {
      const { data } = await api.get(`/content/${id}/similar`, { params: { limit: 10 } });
      return data.data.items;
    },
    enabled: Boolean(id),
  });
}

export function useWatchlistStatus(contentId: string | undefined) {
  return useQuery({
    queryKey: ['watchlist', 'check', contentId],
    queryFn: async (): Promise<{ inWatchlist: boolean; item: { status: string } | null }> => {
      const { data } = await api.get(`/watchlist/check/${contentId}`);
      return data.data;
    },
    enabled: Boolean(contentId),
    retry: false,
  });
}

export function useToggleWatchlist(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inWatchlist: boolean) => {
      if (inWatchlist) await api.delete(`/watchlist/${contentId}`);
      else await api.post('/watchlist', { contentId });
    },
    onSuccess: (_d, inWatchlist) => {
      toast.success(inWatchlist ? 'Removed from watchlist' : 'Added to watchlist');
      void queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Watchlist update failed')),
  });
}

export function useMyRating(contentId: string | undefined) {
  return useQuery({
    queryKey: ['ratings', 'mine', contentId],
    queryFn: async (): Promise<{ score: number; review?: string } | null> => {
      const { data } = await api.get(`/ratings/content/${contentId}`);
      return data.data.rating;
    },
    enabled: Boolean(contentId),
    retry: false,
  });
}

export function useSubmitRating(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { score: number; review?: string }) => {
      const { data } = await api.post('/ratings', { contentId, ...input });
      return data.data.rating;
    },
    onSuccess: () => {
      toast.success('Rating saved');
      void queryClient.invalidateQueries({ queryKey: ['ratings'] });
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Could not save rating')),
  });
}
