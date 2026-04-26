import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from 'urql';
import { ArrowLeft, Search } from 'lucide-react';
import { FETCH_SOURCE_MANGA_DOC, SOURCE_DETAIL_DOC } from './queries';
import { AuthImage } from '@/components/auth-image';
import { MangaCard } from '@/features/library/manga-card';
import { resolveUrl } from '@/lib/server-config';
import { cn } from '@/lib/utils';
import { FetchSourceMangaType } from '@/lib/graphql/__generated__/graphql';

type Tab = FetchSourceMangaType;

type Item = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  inLibrary: boolean;
  unreadCount: number;
  downloadCount: number;
};

export function SourceBrowsePage({ sourceId }: { sourceId: string }) {
  const [{ data: srcData }] = useQuery({
    query: SOURCE_DETAIL_DOC,
    variables: { id: sourceId },
  });
  const source = srcData?.source;

  const [tab, setTab] = useState<Tab>(FetchSourceMangaType.Popular);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 400);
    return () => window.clearTimeout(t);
  }, [query]);

  const effectiveQuery = tab === FetchSourceMangaType.Search ? debouncedQuery : '';

  return (
    <div className="px-4 py-6 md:px-8">
      <Link
        to="/browse"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Sources
      </Link>

      <header className="mb-4 flex items-center gap-3">
        {source ? (
          <AuthImage
            src={resolveUrl(source.iconUrl)}
            alt=""
            className="size-10 shrink-0 rounded-xl bg-background object-contain ring-1 ring-border"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
          />
        ) : null}
        <div className="min-w-0">
          <h2 className="font-display truncate text-2xl font-semibold tracking-tight">
            {source?.displayName ?? source?.name ?? '…'}
          </h2>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {source?.lang ?? ''}
            {source?.isNsfw ? ' · NSFW' : ''}
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: FetchSourceMangaType.Popular, label: 'Popular' },
            ...(source?.supportsLatest
              ? [{ value: FetchSourceMangaType.Latest, label: 'Latest' as const }]
              : []),
            { value: FetchSourceMangaType.Search, label: 'Search' },
          ]}
        />
        {tab === FetchSourceMangaType.Search ? (
          <label className="relative ml-auto flex w-full max-w-sm items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search on ${source?.displayName ?? 'source'}…`}
              className="h-10 w-full rounded-xl border bg-elevated pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </label>
        ) : null}
      </div>

      <SourceMangaGrid sourceId={sourceId} type={tab} query={effectiveQuery} />
    </div>
  );
}

function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-elevated p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            o.value === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SourceMangaGrid({ sourceId, type, query }: { sourceId: string; type: Tab; query: string }) {
  const [, fetchPage] = useMutation(FETCH_SOURCE_MANGA_DOC);
  const [pages, setPages] = useState<Item[][]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset on input change.
  useEffect(() => {
    setPages([]);
    setPage(1);
    setHasNext(true);
    setError(null);
  }, [sourceId, type, query]);

  // Search tab requires a non-empty query.
  const enabled = type !== FetchSourceMangaType.Search || query.trim().length > 0;

  // Fetch the requested page.
  useEffect(() => {
    if (!enabled || !hasNext) return;
    if (pages.length >= page) return;
    let cancelled = false;
    setLoading(true);
    fetchPage({ source: sourceId, type, page, query: query || undefined })
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error.message);
          setHasNext(false);
          return;
        }
        const payload = res.data?.fetchSourceManga;
        if (!payload) {
          setHasNext(false);
          return;
        }
        setPages((p) => [...p, payload.mangas as Item[]]);
        setHasNext(payload.hasNextPage);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, sourceId, type, query, enabled, hasNext, pages.length, fetchPage]);

  // Infinite scroll: when sentinel enters view, request the next page.
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNext && !loading) setPage((p) => p + 1);
    });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasNext, loading]);

  const items = useMemo(() => pages.flat(), [pages]);

  if (!enabled) {
    return <p className="text-sm text-muted-foreground">Type to search.</p>;
  }

  return (
    <>
      {error ? (
        <p className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {items.length === 0 && !loading && !error ? (
        <p className="rounded-xl border border-dashed bg-elevated/40 px-4 py-12 text-center text-sm text-muted-foreground">
          No results.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 md:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {items.map((m) => (
            <div key={m.id} className="relative">
              <MangaCard manga={m} />
              {m.inLibrary ? (
                <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
                  In library
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-12" />
      {loading ? <p className="py-3 text-center text-xs text-muted-foreground">Loading…</p> : null}
      {!hasNext && items.length > 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">End of results.</p>
      ) : null}
    </>
  );
}
