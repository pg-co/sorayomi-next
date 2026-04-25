import { useMutation } from 'urql';
import { Link } from '@tanstack/react-router';
import { CloudDownload, Pause, Play, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mangaThumbnailUrl } from '@/lib/rest/client';
import {
  CLEAR_DOWNLOADER_DOC,
  DEQUEUE_CHAPTER_DOC,
  START_DOWNLOADER_DOC,
  STOP_DOWNLOADER_DOC,
} from './queries';
import { useDownloadStatus } from './use-download-status';

export function DownloadsPage() {
  const status = useDownloadStatus();
  const [, start] = useMutation(START_DOWNLOADER_DOC);
  const [, stop] = useMutation(STOP_DOWNLOADER_DOC);
  const [, clear] = useMutation(CLEAR_DOWNLOADER_DOC);
  const [, dequeue] = useMutation(DEQUEUE_CHAPTER_DOC);

  const running = status.state === 'STARTED';

  async function toggleRun() {
    const res = running ? await stop({}) : await start({});
    if (res.error) toast.error(res.error.message);
  }

  async function onClear() {
    if (status.queue.length === 0) return;
    const res = await clear({});
    if (res.error) toast.error(res.error.message);
    else toast.success('Queue cleared');
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Downloads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {status.queue.length} in queue ·{' '}
            <span className={cn('font-medium', running ? 'text-primary' : 'text-muted-foreground')}>
              {running ? 'Running' : 'Stopped'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleRun}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            {running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {running ? 'Pause' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={status.queue.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border bg-elevated px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            <Trash2 className="size-4" /> Clear
          </button>
        </div>
      </header>

      {status.queue.length === 0 ? (
        <EmptyQueue />
      ) : (
        <ul className="divide-y rounded-2xl border bg-elevated">
          {status.queue.map((d) => (
            <li key={d.chapterId} className="flex items-center gap-3 px-4 py-3">
              <Link
                to="/manga/$mangaId"
                params={{ mangaId: String(d.mangaId) }}
                className="shrink-0"
              >
                <img
                  src={mangaThumbnailUrl(d.mangaId)}
                  alt=""
                  className="aspect-[2/3] w-10 rounded-md object-cover ring-1 ring-border"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.mangaTitle}</p>
                <p className="truncate text-xs text-muted-foreground">{d.chapterName || `Chapter ${d.chapterNumber}`}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.round(d.progress * 100)}%`,
                      backgroundColor: 'var(--downloaded)',
                    }}
                  />
                </div>
              </div>
              <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                {Math.round(d.progress * 100)}%
              </span>
              <button
                type="button"
                onClick={async () => {
                  const r = await dequeue({ id: d.chapterId });
                  if (r.error) toast.error(r.error.message);
                }}
                className="grid size-8 place-items-center text-muted-foreground transition hover:text-destructive"
                aria-label="Cancel download"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed bg-elevated/40 px-6 py-20 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <CloudDownload className="size-6" />
      </div>
      <h3 className="font-display text-lg font-semibold">Queue is empty</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Trigger a download from a manga's chapter list and it will show up here in real time.
      </p>
    </div>
  );
}
