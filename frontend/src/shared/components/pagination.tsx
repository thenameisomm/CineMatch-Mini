import { Button } from '@shared/components/ui/button';

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (_page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = [page - 1, page, page + 1].filter(p => p >= 1 && p <= totalPages);
  if (!pages.includes(1)) pages.unshift(1);
  if (!pages.includes(totalPages)) pages.push(totalPages);
  const unique = [...new Set(pages)].sort((a, b) => a - b);
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      {unique.map(p => (
        <Button key={p} variant={p === page ? 'default' : 'outline'} onClick={() => onChange(p)}>
          {p}
        </Button>
      ))}
      <Button variant="outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </div>
  );
}
