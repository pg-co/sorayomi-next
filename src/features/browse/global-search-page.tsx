import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useMutation } from 'urql';
import { ArrowRight } from 'lucide-react';
import { SOURCES_DOC, FETCH_SOURCE_MANGA_DOC } from './queries';
import { AuthImage } from '@/components/auth-image';
import { MangaCard } from '@/features/library/manga-card';
import { resolveUrl } from '@/lib/server-config';
import { useShowNsfw } from '@/lib/client-prefs';
import { FetchSourceMangaType } from '@/lib/graphql/__generated__/graphql';

type Item = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  inLibrary: boolean;
  unreadCount: number;
  downloadCount: number;
};

type Source = {
  id: string | number;
  name: string;
  displayName?: string | null;
  lang: string;
  iconUrl: string;
  isNsfw: boolean;
};

export function GlobalSearchPage({ query }: { query: string }) {
  const [{ data }] = useQuery({ query: SOURCES_DOC });
  const [showNsfw] = useShowNsfw();

  const sources = useMemo(() => {
    const all = data?.sources.nodes ?? [];
    return showNsfw ? all : all.filter((s) => !s.isNsfw);
  }, [data, showNsfw]);

  if (!query.trim()) {
    return (
      <div className="px-4 py-6 md:px-8">
        <p className="text-sm text-muted-foreground">Enter a search query to find manga across all installed sources.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="mb-6">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          "{query}"
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Searching across {sources.length} source{sources.length !== 1 ? 's' : ''}
        </p>
      </header>

      {sources.length === 0 && data ? (
        <p className="rounded-xl border border-dashed bg-elevated/40 px-4 py-12 text-center text-sm text-muted-foreground">
          No sources installed. Install an extension to search.
        </p>
      ) : (
        <div className="space-y-8">
          {sources.map((s) => (
            <SourceSearchSection key={s.id} source={s as Source} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceSearchSection({ source, query }: { source: Source; query: string }) {
  const [, fetchPage] = useMutation(FETCH_SOURCE_MANGA_DOC);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [done, setDone] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const fetchedQueryRef = useRef('');

  // Reveal once the section enters the viewport (pre-load 300px early).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setIsVisible(true); },
      { rootMargin: '300px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Reset when query changes.
  useEffect(() => {
    fetchedQueryRef.current = '';
    setItems([]);
    setError(null);
    setDone(false);
  }, [query]);

  // Fire the search once this section is visible and query hasn't been fetched yet.
  useEffect(() => {
    if (!isVisible || !query.trim() || fetchedQueryRef.current === query) return;
    fetchedQueryRef.current = query;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPage({ source: String(source.id), type: FetchSourceMangaType.Search, page: 1, query })
      .then((res) => {
        if (cancelled) return;
        if (res.error) {
          setError(res.error.message);
        } else {
          setItems((res.data?.fetchSourceManga?.mangas ?? []) as Item[]);
        }
        setDone(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isVisible, query, fetchPage, source.id]);

  // Hide sections that returned no results (once fully loaded).
  if (done && items.length === 0 && !error) return null;

  return (
    <section ref={sectionRef}>
      <div className="mb-3 flex items-center gap-2">
        <AuthImage
          src={resolveUrl(source.iconUrl)}
          alt=""
          className="size-6 shrink-0 rounded-md object-contain"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
        />
        <h3 className="font-medium">{source.displayName || source.name}</h3>
        <span className="text-xs text-muted-foreground">{source.lang}</span>
        <Link
          to="/browse/source/$sourceId"
          params={{ sourceId: String(source.id) }}
          search={{ tab: FetchSourceMangaType.Search, q: query }}
          className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          See all <ArrowRight className="size-3" />
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Searching…</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
          {items.slice(0, 6).map((m) => (
            <div key={m.id} className="relative">
              <MangaCard manga={m} />
              {m.inLibrary ? (
                <span className="pointer-events-none absolute right-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                  In library
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
