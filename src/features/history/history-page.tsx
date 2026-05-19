import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'urql';
import { History as HistoryIcon } from 'lucide-react';
import { HISTORY_DOC } from './queries';
import { AuthImage } from '@/components/auth-image';
import { mangaThumbnailUrl } from '@/lib/rest/client';

export function HistoryPage() {
  const [{ data, fetching, error }] = useQuery({
    query: HISTORY_DOC,
    requestPolicy: 'cache-and-network',
  });

  const groups = useMemo(() => {
    const rows = data?.chapters.nodes ?? [];
    const byDay = new Map<string, typeof rows>();
    for (const r of rows) {
      const ms = Number(r.lastReadAt);
      if (!Number.isFinite(ms) || ms <= 0) continue;
      const key = dayKey(new Date(ms));
      const arr = byDay.get(key);
      if (arr) arr.push(r);
      else byDay.set(key, [r]);
    }
    return [...byDay.entries()];
  }, [data]);

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="mb-4">
        <h2 className="font-display text-3xl font-semibold tracking-tight">History</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you've read, in reverse-chronological order.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {!error && fetching && !data ? <Skeleton /> : null}

      {!error && data && groups.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed bg-elevated/40 px-6 py-24 text-center">
          <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <HistoryIcon className="size-7" />
          </div>
          <h3 className="font-display text-xl font-semibold tracking-tight">Nothing here yet</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Chapters you've opened will show up here once you've read part of them.
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {groups.map(([day, rows]) => (
          <section key={day}>
            <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {prettyDay(day)}
            </h3>
            <ul className="divide-y rounded-2xl border bg-elevated">
              {rows.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/manga/$mangaId/chapter/$chapterId"
                    params={{ mangaId: String(c.mangaId), chapterId: String(c.id) }}
                    className="flex items-center gap-3 px-3 py-3 transition hover:bg-accent"
                  >
                    <AuthImage
                      src={mangaThumbnailUrl(c.mangaId)}
                      alt=""
                      className="aspect-[2/3] h-14 w-10 shrink-0 rounded object-cover ring-1 ring-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.manga.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.name || `Chapter ${c.chapterNumber}`}
                        {c.pageCount > 0 && c.lastPageRead > 0
                          ? ` · page ${c.lastPageRead + 1}/${c.pageCount}`
                          : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {prettyTime(Number(c.lastReadAt))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-elevated" />
      ))}
    </div>
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function prettyDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return 'Today';
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
}

function prettyTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
