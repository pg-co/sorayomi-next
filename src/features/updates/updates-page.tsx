import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'urql';
import { CheckCircle2, CloudDownload, Sparkles } from 'lucide-react';
import { RECENT_CHAPTERS_DOC } from './queries';
import { LibraryUpdateButton } from './library-update-button';
import { AuthImage } from '@/components/auth-image';
import { mangaThumbnailUrl } from '@/lib/rest/client';
import { cn } from '@/lib/utils';

export function UpdatesPage() {
  const [{ data, fetching, error }] = useQuery({
    query: RECENT_CHAPTERS_DOC,
    variables: { first: 100 },
    requestPolicy: 'cache-and-network',
  });

  const groups = useMemo(() => groupByDay(data?.chapters.nodes ?? []), [data]);

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Updates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent chapters fetched from the sources in your library.
          </p>
        </div>
        <LibraryUpdateButton />
      </header>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {fetching && !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.label}>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3.5" />
                {g.label}
                <span className="text-muted-foreground/60">· {g.items.length}</span>
              </h3>
              <ul className="divide-y rounded-2xl border bg-elevated">
                {g.items.map((c) => (
                  <li key={c.id}>
                    <Link
                      to="/manga/$mangaId/chapter/$chapterId"
                      params={{ mangaId: String(c.mangaId), chapterId: String(c.id) }}
                      className={cn('flex items-center gap-3 px-3 py-3 transition hover:bg-accent', c.isRead && 'opacity-60')}
                    >
                      <AuthImage
                        src={mangaThumbnailUrl(c.mangaId)}
                        alt=""
                        className="aspect-[2/3] w-10 shrink-0 rounded-md object-cover ring-1 ring-border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.manga?.title ?? 'Manga'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.name || `Chapter ${c.chapterNumber}`}
                          {c.scanlator ? ` · ${c.scanlator}` : ''}
                          {c.fetchedAt ? ` · ${formatRelative(c.fetchedAt)}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {c.isDownloaded ? (
                          <CloudDownload className="size-4" style={{ color: 'var(--downloaded)' }} />
                        ) : null}
                        {c.isRead ? <CheckCircle2 className="size-4 text-muted-foreground" /> : null}
                      </div>
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

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed bg-elevated/40 px-6 py-20 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Sparkles className="size-6" />
      </div>
      <h3 className="font-display text-lg font-semibold">No recent updates</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Trigger a library update — newly fetched chapters will appear here grouped by date.
      </p>
    </div>
  );
}

type RecentChapter = {
  id: number;
  mangaId: number;
  name: string;
  chapterNumber: number;
  scanlator?: string | null;
  fetchedAt: unknown;
  isRead: boolean;
  isDownloaded: boolean;
  manga: { id: number; title: string } | null | undefined;
};

const DAY = 24 * 60 * 60 * 1000;

function toMs(value: unknown): number {
  if (typeof value === 'number') return value > 1e12 ? value : value * 1000;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
  }
  return 0;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupByDay(chapters: ReadonlyArray<RecentChapter>): Array<{ label: string; items: RecentChapter[] }> {
  const today = startOfDay(Date.now());
  const yesterday = today - DAY;
  const weekStart = today - 6 * DAY;

  const buckets = new Map<string, RecentChapter[]>();
  const order: string[] = [];

  for (const c of chapters) {
    const ms = toMs(c.fetchedAt);
    const day = ms ? startOfDay(ms) : 0;
    let label: string;
    if (!ms) label = 'Unknown';
    else if (day === today) label = 'Today';
    else if (day === yesterday) label = 'Yesterday';
    else if (day >= weekStart) label = 'This week';
    else label = new Date(day).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(c);
  }

  return order.map((label) => ({ label, items: buckets.get(label)! }));
}

function formatRelative(value: unknown): string {
  const ms = toMs(value);
  if (!ms) return '';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
