import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import type { Content, Paginated } from '@shared/types';

export interface BrowseFilters {
  page: number;
  type?: string;
  genre?: string;
  year?: string;
  minRating?: string;
  sort: string;
  order: string;
}

export function useBrowseContent(filters: BrowseFilters) {
  return useQuery({
    queryKey: ['content', 'browse', filters],
    queryFn: async (): Promise<Paginated<Content>> => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
      );
      const { data } = await api.get('/content', { params });
      return data.data as Paginated<Content>;
    },
  });
}

export function useGenres() {
  return useQuery({
    queryKey: ['content', 'genres'],
    queryFn: async (): Promise<{ id: number; name: string; count: number }[]> => {
      const { data } = await api.get('/content/genres');
      return data.data.items;
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useTrending(limit = 10, type?: string) {
  return useQuery({
    queryKey: ['content', 'trending', limit, type],
    queryFn: async (): Promise<Content[]> => {
      const { data } = await api.get('/content/trending', {
        params: { limit, ...(type ? { type } : {}) },
      });
      return data.data.items as Content[];
    },
  });
}
