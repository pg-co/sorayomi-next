import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useClient, useQuery } from 'urql';
import { ArrowLeft, ChevronRight, Languages, Search } from 'lucide-react';
import { FETCH_SOURCE_MANGA_DOC, SOURCES_DOC } from './queries';
import { AuthImage } from '@/components/auth-image';
import { MangaCard, type MangaCardData } from '@/features/library/manga-card';
import { resolveUrl } from '@/lib/server-config';
import { useShowNsfw } from '@/lib/client-prefs';
import { cn } from '@/lib/utils';
import { FetchSourceMangaType } from '@/lib/graphql/__generated__/graphql';

type SourceSummary = {
  id: string;
  name: string;
  displayName: string;
  lang: string;
  iconUrl: string;
  isNsfw: boolean;
};

type SectionState =
  | { status: 'pending' }
  | { status: 'loading' }
  | { status: 'loaded'; results: MangaCardData[]; hasNextPage: boolean }
  | { status: 'error'; message: string };

const CONCURRENCY = 6;
const PER_SOURCE_LIMIT = 8;

export function GlobalSearchPage({ initialQuery }: { initialQuery?: string }) {
  const navigate = useNavigate();
  const [{ data }] = useQuery({ query: SOURCES_DOC });

  const [showNsfw, setShowNsfw] = useShowNsfw();
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState(true);

  const [input, setInput] = useState(initialQuery ?? '');
  const [debounced, setDebounced] = useState(initialQuery ?? '');

  // Keep URL in sync with the debounced query so the page is shareable.
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input.trim()), 350);
    return () => window.clearTimeout(t);
  }, [input]);

  useEffect(() => {
    navigate({
      to: '/browse/search',
      search: debounced ? { q: debounced } : {},
      replace: true,
    });
  }, [debounced, navigate]);

  const allSources: SourceSummary[] = useMemo(
    () =>
      (data?.sources.nodes ?? []).map((s) => ({
        id: String(s.id),
        name: s.name,
        displayName: s.displayName,
        lang: s.lang,
        iconUrl: s.iconUrl,
        isNsfw: s.isNsfw,
      })),
    [data],
  );

  const langs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allSources) {
      if (!showNsfw && s.isNsfw) continue;
      counts.set(s.lang, (counts.get(s.lang) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [allSources, showNsfw]);

  const visibleSources = useMemo(
    () =>
      allSources.filter((s) => {
        if (!showNsfw && s.isNsfw) return false;
        if (activeLang && s.lang !== activeLang) return false;
        return true;
      }),
    [allSources, showNsfw, activeLang],
  );

  return (
    <div className="px-4 py-6 md:px-8">
      <Link
        to="/browse"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Sources
      </Link>

      <header className="reveal mb-4">
        <h2 className="font-display text-3xl font-semibold uppercase tracking-tight">Global search</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search every installed source at once. Use the language chips to narrow down.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative flex flex-1 min-w-56 items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search across all sources…"
            className="glass h-10 w-full rounded-xl pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:shadow-[0_0_18px_-6px_var(--accent-cyan)]"
            autoFocus
          />
        </label>
        <button
          type="button"
          onClick={() => setHideEmpty((v) => !v)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
            hideEmpty
              ? 'border border-primary/50 bg-primary/10 text-primary shadow-[0_0_16px_-6px_var(--accent-cyan)]'
              : 'glass text-muted-foreground hover:text-foreground',
          )}
        >
          Hide empty {hideEmpty ? 'on' : 'off'}
        </button>
        <button
          type="button"
          onClick={() => setShowNsfw(!showNsfw)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
            showNsfw
              ? 'border border-accent-magenta/50 bg-accent-magenta/10 text-accent-magenta shadow-[0_0_16px_-6px_var(--accent-magenta)]'
              : 'glass text-muted-foreground hover:text-foreground',
          )}
        >
          NSFW {showNsfw ? 'on' : 'off'}
        </button>
      </div>

      {langs.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <LangChip
            active={activeLang === null}
            onClick={() => setActiveLang(null)}
            label="All"
            count={visibleSources.length}
          />
          {langs.map(([lang, n]) => (
            <LangChip
              key={lang}
              active={activeLang === lang}
              onClick={() => setActiveLang(lang)}
              label={lang.toUpperCase()}
              count={n}
            />
          ))}
        </div>
      ) : null}

      {debounced.length < 2 ? (
        <p className="glass rounded-xl border-dashed border-glass-border px-4 py-12 text-center text-sm text-muted-foreground">
          Type at least 2 characters to search.
        </p>
      ) : visibleSources.length === 0 ? (
        <p className="glass rounded-xl border-dashed border-glass-border px-4 py-12 text-center text-sm text-muted-foreground">
          No sources match the current filters.
        </p>
      ) : (
        <SearchRunner query={debounced} sources={visibleSources} hideEmpty={hideEmpty} />
      )}
    </div>
  );
}

function SearchRunner({
  query,
  sources,
  hideEmpty,
}: {
  query: string;
  sources: SourceSummary[];
  hideEmpty: boolean;
}) {
  const client = useClient();
  const [states, setStates] = useState<Record<string, SectionState>>({});

  // Re-run whenever the query or the visible source set changes.
  useEffect(() => {
    setStates(() => {
      const init: Record<string, SectionState> = {};
      for (const s of sources) init[s.id] = { status: 'pending' };
      return init;
    });

    let cancelled = false;
    const queue = sources.slice();
    let active = 0;

    const pump = () => {
      if (cancelled) return;
      while (active < CONCURRENCY && queue.length > 0) {
        const src = queue.shift()!;
        active++;
        setStates((prev) => ({ ...prev, [src.id]: { status: 'loading' } }));

        client
          .mutation(FETCH_SOURCE_MANGA_DOC, {
            source: src.id,
            type: FetchSourceMangaType.Search,
            page: 1,
            query,
          })
          .toPromise()
          .then((res) => {
            if (cancelled) return;
            if (res.error) {
              setStates((prev) => ({
                ...prev,
                [src.id]: { status: 'error', message: res.error!.message },
              }));
              return;
            }
            const payload = res.data?.fetchSourceManga;
            const results: MangaCardData[] = (payload?.mangas ?? [])
              .slice(0, PER_SOURCE_LIMIT)
              .map((m) => ({
                id: m.id,
                title: m.title,
                thumbnailUrl: m.thumbnailUrl,
                unreadCount: m.unreadCount,
                downloadCount: m.downloadCount,
              }));
            setStates((prev) => ({
              ...prev,
              [src.id]: {
                status: 'loaded',
                results,
                hasNextPage: payload?.hasNextPage ?? false,
              },
            }));
          })
          .catch((e: unknown) => {
            if (cancelled) return;
            setStates((prev) => ({
              ...prev,
              [src.id]: {
                status: 'error',
                message: e instanceof Error ? e.message : 'Request failed',
              },
            }));
          })
          .finally(() => {
            active--;
            pump();
          });
      }
    };

    pump();

    return () => {
      cancelled = true;
    };
  }, [query, sources, client]);

  const visible = hideEmpty
    ? sources.filter((s) => {
        const st = states[s.id];
        if (!st) return true;
        if (st.status === 'loaded' && st.results.length === 0) return false;
        if (st.status === 'error') return false;
        return true;
      })
    : sources;

  if (visible.length === 0) {
    return (
      <p className="glass rounded-xl border-dashed border-glass-border px-4 py-12 text-center text-sm text-muted-foreground">
        No results from any source.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {visible.map((s) => (
        <SourceSection key={s.id} source={s} state={states[s.id] ?? { status: 'pending' }} query={query} />
      ))}
    </div>
  );
}

function SourceSection({
  source,
  state,
  query,
}: {
  source: SourceSummary;
  state: SectionState;
  query: string;
}) {
  return (
    <section className="glass rounded-2xl">
      <header className="flex items-center gap-3 px-3 py-2.5">
        <AuthImage
          src={resolveUrl(source.iconUrl)}
          alt=""
          className="size-7 shrink-0 rounded-lg bg-background/60 object-contain ring-1 ring-glass-border"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{source.displayName || source.name}</p>
          <p className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {source.lang}
            {source.isNsfw ? ' · NSFW' : ''}
          </p>
        </div>
        <Link
          to="/browse/source/$sourceId"
          params={{ sourceId: source.id }}
          search={{ q: query }}
          className="group/all inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-accent/40 hover:text-primary"
        >
          View all <ChevronRight className="size-3.5 transition-transform group-hover/all:translate-x-0.5" />
        </Link>
      </header>

      <div className="border-t border-glass-border px-3 py-3">
        <SectionBody state={state} />
      </div>
    </section>
  );
}

function SectionBody({ state }: { state: SectionState }) {
  if (state.status === 'pending' || state.status === 'loading') {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] w-[120px] shrink-0 animate-pulse rounded-xl bg-muted/60 ring-1 ring-glass-border"
          />
        ))}
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <p className="text-xs text-destructive">{state.message}</p>
    );
  }
  if (state.results.length === 0) {
    return <p className="text-xs text-muted-foreground">No results.</p>;
  }
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-thin">
      {state.results.map((m) => (
        <div key={m.id} className="w-[120px] shrink-0">
          <MangaCard manga={m} />
        </div>
      ))}
    </div>
  );
}

function LangChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-medium transition',
        active
          ? 'border border-primary/50 bg-primary/10 text-primary shadow-[0_0_14px_-5px_var(--accent-cyan)]'
          : 'glass text-muted-foreground hover:text-foreground',
      )}
    >
      <Languages className="size-3" />
      {label}
      <span className="opacity-60">· {count}</span>
    </button>
  );
}
