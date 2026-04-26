import { useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from 'urql';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowLeft, BookmarkCheck, BookOpen, CheckCircle2, CloudDownload, FolderTree, Heart, HeartOff, Play } from 'lucide-react';
import { MANGA_CHAPTERS_DOC, MANGA_DETAIL_DOC, UPDATE_MANGA_LIBRARY_DOC } from './queries';
import { CategoryPicker } from './category-picker';
import type { MangaChaptersQuery, MangaDetailQuery } from '@/lib/graphql/__generated__/graphql';
import { AuthImage } from '@/components/auth-image';
import { mangaThumbnailUrl } from '@/lib/rest/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DownloadProgressButton } from '@/features/downloads/download-progress-button';
import { ENQUEUE_CHAPTERS_DOC } from '@/features/downloads/queries';
import { useDownloadsByChapter } from '@/features/downloads/use-download-status';
import type { QueuedDownload } from '@/features/downloads/use-download-status';

type DetailManga = MangaDetailQuery['manga'];

export function MangaDetailPage({ mangaId }: { mangaId: number }) {
  const [{ data, fetching, error }, reload] = useQuery({ query: MANGA_DETAIL_DOC, variables: { id: mangaId } });

  if (error) {
    return (
      <div className="px-4 py-6 md:px-8">
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      </div>
    );
  }

  if (fetching && !data) return <DetailSkeleton />;
  if (!data) return null;

  return (
    <div>
      <Hero manga={data.manga} onLibraryChange={() => reload({ requestPolicy: 'network-only' })} />
      <ChapterList mangaId={mangaId} />
    </div>
  );
}

function Hero({ manga, onLibraryChange }: { manga: DetailManga; onLibraryChange: () => void }) {
  return (
    <header className="relative overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10">
        <AuthImage
          src={mangaThumbnailUrl(manga.id)}
          alt=""
          className="size-full object-cover opacity-40 blur-2xl saturate-150"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
      </div>

      <div className="px-4 py-6 md:px-8 md:py-10">
        <Link
          to="/library"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Library
        </Link>

        <div className="flex flex-col items-center gap-5 md:grid md:grid-cols-[200px_1fr] md:items-start md:gap-8">
          <AuthImage
            src={mangaThumbnailUrl(manga.id)}
            alt=""
            className="aspect-[2/3] w-32 rounded-2xl object-cover shadow-lg ring-1 ring-border md:w-full"
          />

          <div className="flex w-full min-w-0 flex-col">
            <h1 className="text-center font-display text-2xl font-semibold tracking-tight md:text-left md:text-4xl">{manga.title}</h1>
            {manga.author ? (
              <p className="mt-1 text-center text-sm text-muted-foreground md:text-left">
                {manga.author}
                {manga.artist && manga.artist !== manga.author ? ` · ${manga.artist}` : null}
              </p>
            ) : null}

            {manga.source ? (
              <p className="mt-1 text-center text-xs uppercase tracking-wider text-muted-foreground md:text-left">
                {manga.source.displayName} · {manga.source.lang}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <LibraryToggle id={manga.id} inLibrary={manga.inLibrary} onChanged={onLibraryChange} />
              {manga.inLibrary ? (
                <CategoriesButton
                  mangaId={manga.id}
                  currentIds={manga.categories.nodes.map((c) => c.id)}
                />
              ) : null}
              <Stat label="Unread" value={manga.unreadCount} accent="unread" />
              <Stat label="Downloaded" value={manga.downloadCount} accent="downloaded" />
              <Stat label="Chapters" value={manga.chapters.totalCount} />
            </div>

            {manga.genre.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {manga.genre.map((g) => (
                  <li
                    key={g}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {g}
                  </li>
                ))}
              </ul>
            ) : null}

            {manga.description ? (
              <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {manga.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'unread' | 'downloaded';
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border bg-elevated px-2.5 py-1 text-xs">
      {accent ? (
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: `var(--${accent})` }}
          aria-hidden
        />
      ) : null}
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function LibraryToggle({
  id,
  inLibrary,
  onChanged,
}: {
  id: number;
  inLibrary: boolean;
  onChanged: () => void;
}) {
  const [, run] = useMutation(UPDATE_MANGA_LIBRARY_DOC);
  const [pending, setPending] = useState(false);
  async function toggle() {
    setPending(true);
    try {
      const res = await run({ id, inLibrary: !inLibrary });
      if (res.error) toast.error(res.error.message);
      else {
        onChanged();
        toast.success(inLibrary ? 'Removed from library' : 'Added to library');
      }
    } finally {
      setPending(false);
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition',
        inLibrary
          ? 'bg-secondary text-secondary-foreground hover:bg-accent'
          : 'bg-primary text-primary-foreground shadow-sm hover:opacity-95',
        pending && 'opacity-60',
      )}
    >
      {inLibrary ? <HeartOff className="size-4" /> : <Heart className="size-4" />}
      {inLibrary ? 'In library' : 'Add to library'}
    </button>
  );
}

function CategoriesButton({ mangaId, currentIds }: { mangaId: number; currentIds: number[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition hover:bg-accent"
      >
        <FolderTree className="size-4" />
        Categories
      </button>
      <CategoryPicker
        mangaId={mangaId}
        currentIds={currentIds}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function ChapterList({ mangaId }: { mangaId: number }) {
  const [{ data, fetching, error }] = useQuery({
    query: MANGA_CHAPTERS_DOC,
    variables: { mangaId },
  });

  const chapters = useMemo(() => data?.chapters.nodes ?? [], [data]);
  const firstUnread = useMemo(
    () => [...chapters].reverse().find((c) => !c.isRead) ?? chapters[0],
    [chapters],
  );
  const queueMap = useDownloadsByChapter();
  const downloadableUnread = useMemo(
    () =>
      chapters
        .filter((c) => !c.isRead && !c.isDownloaded && !queueMap.has(c.id))
        .map((c) => c.id),
    [chapters, queueMap],
  );
  const [, enqueueMany] = useMutation(ENQUEUE_CHAPTERS_DOC);

  return (
    <section className="px-4 pb-10 md:px-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {chapters.length} chapter{chapters.length === 1 ? '' : 's'}
        </h2>
        <div className="flex items-center gap-2">
          {downloadableUnread.length > 0 ? (
            <button
              type="button"
              onClick={async () => {
                const r = await enqueueMany({ ids: downloadableUnread });
                if (r.error) toast.error(r.error.message);
                else toast.success(`Queued ${downloadableUnread.length} chapter${downloadableUnread.length === 1 ? '' : 's'}`);
              }}
              className="inline-flex items-center gap-2 rounded-xl border bg-elevated px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <CloudDownload className="size-4" />
              Download {downloadableUnread.length} unread
            </button>
          ) : null}
          {firstUnread ? (
            <Link
              to="/manga/$mangaId/chapter/$chapterId"
              params={{ mangaId: String(mangaId), chapterId: String(firstUnread.id) }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
            >
              <Play className="size-4" />
              {firstUnread.lastPageRead > 0 ? 'Continue reading' : 'Start reading'}
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {fetching && !data ? (
        <ChapterListSkeleton />
      ) : (
        <VirtualChapterList mangaId={mangaId} chapters={chapters} queueMap={queueMap} />
      )}
    </section>
  );
}

type ChapterRow = MangaChaptersQuery['chapters']['nodes'][number];

function VirtualChapterList({
  mangaId,
  chapters,
  queueMap,
}: {
  mangaId: number;
  chapters: ReadonlyArray<ChapterRow>;
  queueMap: ReadonlyMap<number, QueuedDownload>;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: chapters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 8,
  });

  return (
    <div
      ref={parentRef}
      className="max-h-[70vh] overflow-y-auto rounded-2xl border bg-elevated scrollbar-thin"
    >
      <div
        style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const c = chapters[vi.index];
          return (
            <div
              key={c.id}
              ref={virtualizer.measureElement}
              data-index={vi.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start}px)`,
              }}
              className={cn(vi.index !== 0 && 'border-t')}
            >
              <Link
                to="/manga/$mangaId/chapter/$chapterId"
                params={{ mangaId: String(mangaId), chapterId: String(c.id) }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition hover:bg-accent',
                  c.isRead && 'opacity-60',
                )}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
                  {c.isRead ? <CheckCircle2 className="size-4" /> : <BookOpen className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {c.name || `Chapter ${c.chapterNumber}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      c.scanlator,
                      c.uploadDate ? formatDate(c.uploadDate) : null,
                      c.pageCount > 0 ? `${c.pageCount} pages` : null,
                      c.lastPageRead > 0 && !c.isRead ? `read to ${c.lastPageRead}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {c.isBookmarked ? (
                    <BookmarkCheck className="size-4" style={{ color: 'var(--bookmarked)' }} />
                  ) : null}
                  <DownloadProgressButton
                    chapterId={c.id}
                    isDownloaded={c.isDownloaded}
                    queued={queueMap.get(c.id)}
                  />
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChapterListSkeleton() {
  return (
    <div className="divide-y rounded-2xl border bg-elevated">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="size-8 animate-pulse rounded-lg bg-background" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 animate-pulse rounded bg-background" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-background" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="px-4 py-6 md:px-8">
      <div className="flex flex-col items-center gap-5 md:grid md:grid-cols-[200px_1fr] md:items-start md:gap-8">
        <div className="aspect-[2/3] w-32 animate-pulse rounded-2xl bg-elevated md:w-full" />
        <div className="w-full space-y-3">
          <div className="h-7 w-2/3 animate-pulse rounded bg-elevated" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-elevated" />
          <div className="h-3 w-full animate-pulse rounded bg-elevated" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-elevated" />
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string | number) {
  const ms = typeof iso === 'string' ? Number(iso) : iso;
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
