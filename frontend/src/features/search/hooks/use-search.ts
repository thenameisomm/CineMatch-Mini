import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import type { Content, Paginated } from '@shared/types';

export function useKeywordSearch(q: string, page: number, type?: string) {
  return useQuery({
    queryKey: ['search', 'keyword', q, page, type],
    queryFn: async (): Promise<Paginated<Content>> => {
      const { data } = await api.get('/search', {
        params: { q, page, limit: 20, ...(type ? { type } : {}) },
      });
      return data.data as Paginated<Content>;
    },
    enabled: q.trim().length > 0,
  });
}

export function useAutocomplete(q: string, type?: string) {
  return useQuery({
    queryKey: ['search', 'suggest', q, type],
    queryFn: async (): Promise<{ _id: string; title: string; type: string }[]> => {
      const { data } = await api.get('/search/suggest', {
        params: { q, limit: 6, ...(type ? { type } : {}) },
      });
      return data.data.items;
    },
    enabled: q.trim().length >= 2,
    staleTime: 60 * 1000,
  });
}

export interface NLResult extends Paginated<Content> {
  intent: Record<string, unknown>;
  searchPath: 'hybrid' | 'text_fallback';
}

export function useNaturalSearch() {
  return useMutation({
    mutationFn: async (input: { query: string; page?: number }): Promise<NLResult> => {
      const { data } = await api.post('/search/natural', {
        query: input.query,
        page: input.page ?? 1,
        limit: 20,
      });
      return data.data as NLResult;
    },
  });
}
