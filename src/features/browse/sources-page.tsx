import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'urql';
import { ChevronRight, Compass, Languages, Puzzle, Search } from 'lucide-react';
import { SOURCES_DOC } from './queries';
import { AuthImage } from '@/components/auth-image';
import { resolveUrl } from '@/lib/server-config';
import { useShowNsfw } from '@/lib/client-prefs';
import { cn } from '@/lib/utils';

export function SourcesPage({ initialFilter }: { initialFilter?: string } = {}) {
  const [{ data, fetching, error }] = useQuery({ query: SOURCES_DOC });
  const sources = useMemo(() => data?.sources.nodes ?? [], [data]);

  const [filter, setFilter] = useState(initialFilter ?? '');
  const [showNsfw, setShowNsfw] = useShowNsfw();
  const [activeLang, setActiveLang] = useState<string | null>(null);

  const langs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sources) {
      if (!showNsfw && s.isNsfw) continue;
      counts.set(s.lang, (counts.get(s.lang) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [sources, showNsfw]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return sources.filter((s) => {
      if (!showNsfw && s.isNsfw) return false;
      if (activeLang && s.lang !== activeLang) return false;
      if (q && !`${s.name} ${s.displayName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sources, showNsfw, activeLang, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const s of visible) {
      const arr = map.get(s.lang);
      if (arr) arr.push(s);
      else map.set(s.lang, [s]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Browse</h2>
          <p className="mt-1 text-sm text-muted-foreground">Discover manga from your installed sources.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/browse/extensions"
            className="inline-flex items-center gap-2 rounded-xl border bg-elevated px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Puzzle className="size-4" />
            Extensions
          </Link>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative flex flex-1 min-w-56 items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter sources…"
            className="h-10 w-full rounded-xl border bg-elevated pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowNsfw(!showNsfw)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition',
            showNsfw ? 'bg-primary/10 text-primary' : 'bg-elevated text-muted-foreground hover:text-foreground',
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
            count={visible.length}
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

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {fetching && !data ? (
        <p className="text-sm text-muted-foreground">Loading sources…</p>
      ) : grouped.length === 0 && !error ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {grouped.map(([lang, group]) => (
            <section key={lang}>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Languages className="size-3.5" />
                {lang}
                <span className="text-muted-foreground/60">· {group.length}</span>
              </h3>
              <ul className="divide-y rounded-2xl border bg-elevated">
                {group.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/browse/source/$sourceId"
                      params={{ sourceId: String(s.id) }}
                      className="flex items-center gap-3 px-3 py-3 transition hover:bg-accent"
                    >
                      <AuthImage
                        src={resolveUrl(s.iconUrl)}
                        alt=""
                        className="size-8 shrink-0 rounded-lg bg-background object-contain ring-1 ring-border"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.displayName || s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[s.lang, s.supportsLatest ? 'Latest' : null, s.isNsfw ? 'NSFW' : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
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
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition',
        active ? 'border-primary bg-primary/10 text-primary' : 'bg-elevated text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      <span className="opacity-60">· {count}</span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed bg-elevated/40 px-6 py-20 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Compass className="size-6" />
      </div>
      <h3 className="font-display text-lg font-semibold">No sources installed</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Install an extension to add a source.
      </p>
      <Link
        to="/browse/extensions"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
      >
        Browse extensions
      </Link>
    </div>
  );
}
