import { Film } from 'lucide-react';
import { ContentCard } from '@shared/components/content-card';
import { CardSkeleton } from '@shared/components/ui/skeleton';
import type { Content } from '@shared/types';

export function ContentGrid({
  items,
  isLoading,
  reasons,
  emptyMessage = 'No titles found. Try different filters.',
}: {
  items: Content[];
  isLoading: boolean;
  reasons?: Map<string, string>;
  emptyMessage?: string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <Film className="h-10 w-10 text-muted-foreground/50" />
        <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map(c => (
        <ContentCard key={c._id} content={c} reason={reasons?.get(c._id)} />
      ))}
    </div>
  );
}
