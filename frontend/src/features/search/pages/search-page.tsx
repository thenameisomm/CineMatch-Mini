import { useState, type FormEvent } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import { ContentGrid } from '@shared/components/content-grid';
import { Pagination } from '@shared/components/pagination';
import {
  useAutocomplete,
  useKeywordSearch,
  useNaturalSearch,
} from '@features/search/hooks/use-search';

const EXAMPLES = [
  'Something like Interstellar but less serious and under 2 hours',
  'Feel-good comedies for family movie night',
  'Dark crime dramas like Breaking Bad',
  'Short animated movies under 2 hours',
];

export function SearchPage() {
  const [mode, setMode] = useState<'keyword' | 'natural'>('natural');
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [page, setPage] = useState(1);

  const keyword = useKeywordSearch(submitted, page);
  const natural = useNaturalSearch();
  const suggest = useAutocomplete(mode === 'keyword' ? input : '');

  const submitKeyword = (q: string) => {
    setSubmitted(q);
    setPage(1);
  };

  const submitNatural = (q: string) => {
    setSubmitted(q);
    natural.mutate({ query: q, page: 1 });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (mode === 'keyword') submitKeyword(input);
    else submitNatural(input);
  };

  const nlData = natural.data;
  const activeItems = mode === 'keyword' ? (keyword.data?.items ?? []) : (nlData?.items ?? []);
  const activeLoading = mode === 'keyword' ? keyword.isFetching : natural.isPending;
  const totalPages =
    mode === 'keyword' ? (keyword.data?.totalPages ?? 0) : (nlData?.totalPages ?? 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        {mode === 'natural' ? (
          <Sparkles className="h-7 w-7 text-primary" />
        ) : (
          <Search className="h-7 w-7 text-primary" />
        )}
        Search
      </h1>
      <p className="mb-6 text-muted-foreground">
        {mode === 'natural'
          ? 'Describe what you want in plain language — the system extracts genres, runtime, mood, and reference titles.'
          : 'Classic keyword search across titles, overviews, and keywords.'}
      </p>

      <div className="mb-4 flex gap-2">
        <Button
          variant={mode === 'natural' ? 'default' : 'outline'}
          onClick={() => setMode('natural')}
        >
          <Sparkles className="mr-2 h-4 w-4" /> Natural language
        </Button>
        <Button
          variant={mode === 'keyword' ? 'default' : 'outline'}
          onClick={() => setMode('keyword')}
        >
          <Search className="mr-2 h-4 w-4" /> Keyword
        </Button>
      </div>

      <form onSubmit={onSubmit} className="relative mb-2 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={
            mode === 'natural'
              ? 'Try: something like Interstellar but less serious and under 2 hours…'
              : 'Titles, themes, people…'
          }
          className="text-base"
        />
        <Button type="submit" disabled={activeLoading}>
          {activeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
        {mode === 'keyword' && suggest.data && suggest.data.length > 0 && (
          <div className="absolute left-0 right-20 top-full z-10 mt-1 overflow-hidden rounded-md border bg-popover shadow-lg">
            {suggest.data.map(s => (
              <button
                key={s._id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setInput(s.title);
                  submitKeyword(s.title);
                }}
              >
                {s.title}{' '}
                <span className="text-xs uppercase text-muted-foreground">· {s.type}</span>
              </button>
            ))}
          </div>
        )}
      </form>

      {mode === 'natural' && !submitted && (
        <div className="mb-6 flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setInput(ex);
                submitNatural(ex);
              }}
              className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {mode === 'natural' && nlData && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={nlData.searchPath === 'hybrid' ? 'success' : 'warning'}>
            {nlData.searchPath === 'hybrid'
              ? 'Local keyword search'
              : 'Keyword search · local text match'}
          </Badge>
          <span className="text-muted-foreground">{nlData.totalResults} results</span>
        </div>
      )}

      {submitted && (
        <>
          <ContentGrid
            items={activeItems}
            isLoading={activeLoading}
            emptyMessage="No matches. Try rephrasing or removing constraints."
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={p => {
              setPage(p);
              if (mode === 'natural') natural.mutate({ query: submitted, page: p });
            }}
          />
        </>
      )}
    </div>
  );
}
