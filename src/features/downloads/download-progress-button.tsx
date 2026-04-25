import { useState } from 'react';
import { useMutation } from 'urql';
import { CheckCircle2, CloudDownload, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DELETE_DOWNLOADED_CHAPTER_DOC,
  DEQUEUE_CHAPTER_DOC,
  ENQUEUE_CHAPTER_DOC,
} from './queries';
import type { QueuedDownload } from './use-download-status';

export function DownloadProgressButton({
  chapterId,
  isDownloaded,
  queued,
  className,
}: {
  chapterId: number;
  isDownloaded: boolean;
  queued?: QueuedDownload;
  className?: string;
}) {
  const [, enqueue] = useMutation(ENQUEUE_CHAPTER_DOC);
  const [, dequeue] = useMutation(DEQUEUE_CHAPTER_DOC);
  const [, del] = useMutation(DELETE_DOWNLOADED_CHAPTER_DOC);
  const [busy, setBusy] = useState(false);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (queued) {
        const r = await dequeue({ id: chapterId });
        if (r.error) toast.error(r.error.message);
      } else if (isDownloaded) {
        const r = await del({ id: chapterId });
        if (r.error) toast.error(r.error.message);
      } else {
        const r = await enqueue({ id: chapterId });
        if (r.error) toast.error(r.error.message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (queued) {
    const pct = Math.round(queued.progress * 100);
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Downloading ${pct}% (${queued.state.toLowerCase()}) — click to cancel`}
        className={cn('group relative grid size-8 place-items-center text-muted-foreground', className)}
      >
        <ProgressRing progress={queued.progress} />
        <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold tabular-nums opacity-100 group-hover:opacity-0 [@media(hover:none)]:opacity-0">
          {pct}
        </span>
        <X className="absolute size-4 opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100" />
      </button>
    );
  }

  if (isDownloaded) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Downloaded — click to delete"
        className={cn('group relative grid size-8 place-items-center', className)}
        style={{ color: 'var(--downloaded)' }}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="size-4 transition group-hover:opacity-0 [@media(hover:none)]:opacity-0" />
            <Trash2 className="absolute size-4 opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100" />
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Download chapter"
      disabled={busy}
      className={cn(
        'grid size-8 place-items-center text-muted-foreground transition hover:text-foreground',
        className,
      )}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <CloudDownload className="size-4" />}
    </button>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const r = 12;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <svg className="size-7 -rotate-90" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <circle
        cx="16"
        cy="16"
        r={r}
        fill="none"
        stroke="var(--downloaded)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 200ms linear' }}
      />
    </svg>
  );
}
