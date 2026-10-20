import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Badge } from '@shared/components/ui/badge';
import { ContentGrid } from '@shared/components/content-grid';
import type { Content } from '@shared/types';

interface Reco {
  content: Content;
  score: number;
  reasons: { type: string; detail: string; referenceTitle?: string }[];
}

export function RecommendationsPage() {
  const forYou = useQuery({
    queryKey: ['recommendations', 'for-you'],
    queryFn: async (): Promise<{ items: Reco[]; personalized: boolean }> => {
      const { data } = await api.get('/recommendations/for-you', { params: { limit: 20 } });
      return data.data;
    },
  });
  const trending = useQuery({
    queryKey: ['recommendations', 'trending'],
    queryFn: async (): Promise<{ items: Reco[] }> => {
      const { data } = await api.get('/recommendations/trending', { params: { limit: 10 } });
      return data.data;
    },
  });

  const reasons = new Map(
    (forYou.data?.items ?? []).map(r => [r.content._id, r.reasons.map(x => x.detail).join(' · ')])
  );

  return (
    <div className="container mx-auto space-y-10 px-4 py-8">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h1 className="text-3xl font-bold">For you</h1>
          {forYou.data && (
            <Badge variant={forYou.data.personalized ? 'success' : 'warning'}>
              {forYou.data.personalized
                ? 'Personalized'
                : 'Trending fallback — rate titles to personalize'}
            </Badge>
          )}
        </div>
        <p className="mb-4 text-muted-foreground">
          Content-based picks from your high ratings and watchlist, diversified so one franchise
          doesn&apos;t dominate.
        </p>
        <ContentGrid
          items={(forYou.data?.items ?? []).map(r => r.content)}
          isLoading={forYou.isLoading}
          reasons={reasons}
        />
      </div>
      <div>
        <h2 className="mb-4 text-2xl font-bold">Trending now</h2>
        <ContentGrid
          items={(trending.data?.items ?? []).map(r => r.content)}
          isLoading={trending.isLoading}
        />
      </div>
    </div>
  );
}
