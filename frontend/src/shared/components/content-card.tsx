import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { onPosterError, posterUrl } from '@shared/lib/tmdb-image';
import { yearOf, type Content } from '@shared/types';

export function ContentCard({ content, reason }: { content: Content; reason?: string }) {
  const poster = posterUrl(content.posterPath);
  return (
    <Link to={`/content/${content.type}/${content._id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[2/3] bg-muted">
          {poster ? (
            <img
              src={poster}
              alt={content.title}
              loading="lazy"
              onError={onPosterError}
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
              {content.title}
            </div>
          )}
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {content.voteAverage?.toFixed(1) ?? '—'}
          </span>
          <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
            {content.type}
          </span>
        </div>
        <CardContent className="p-3">
          <h3 className="truncate text-sm font-medium">{content.title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {yearOf(content)}
            {content.genres?.length
              ? ` • ${content.genres
                  .slice(0, 2)
                  .map(g => g.name)
                  .join(', ')}`
              : ''}
          </p>
          {reason && (
            <div className="mt-2">
              <Badge
                variant="secondary"
                className="whitespace-normal text-left text-[10px] leading-tight"
              >
                {reason}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
