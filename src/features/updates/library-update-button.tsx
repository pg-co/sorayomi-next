import { useMutation } from 'urql';
import { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, Square } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UPDATE_LIBRARY_DOC, UPDATE_STOP_DOC } from './queries';
import { useLibraryUpdateStatus } from './use-update-status';

export function LibraryUpdateButton() {
  const status = useLibraryUpdateStatus();
  const [, run] = useMutation(UPDATE_LIBRARY_DOC);
  const [, stop] = useMutation(UPDATE_STOP_DOC);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  async function start() {
    const r = await run({});
    if (r.error) toast.error(r.error.message);
    else {
      toast.success('Library update started');
      setOpen(true);
    }
  }

  async function cancel() {
    const r = await stop({});
    if (r.error) toast.error(r.error.message);
    else toast.success('Library update stopped');
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (status.isRunning ? setOpen((v) => !v) : start())}
        aria-label={status.isRunning ? 'Library update in progress' : 'Update library'}
        className={cn(
          'glass inline-flex items-center gap-2 rounded-xl p-2 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground sm:px-3 sm:py-2',
          status.isRunning && 'border-primary/50 text-primary shadow-[0_0_16px_-6px_var(--accent-cyan)]',
        )}
      >
        {status.isRunning ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        <span className="hidden sm:inline">
          {status.isRunning ? `Updating ${status.complete + status.failed + status.skipped}/${status.total}` : 'Update library'}
        </span>
      </button>

      {open && status.isRunning ? (
        <div className="glass-strong absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl p-4 shadow-2xl shadow-[0_0_40px_-12px_var(--accent-cyan)]">
          <p className="font-display text-sm font-semibold uppercase tracking-tight">Updating library</p>
          <ProgressBar status={status} />
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>Complete: <span className="text-foreground">{status.complete}</span></li>
            <li>Running: <span className="text-foreground">{status.running}</span></li>
            <li>Pending: <span className="text-foreground">{status.pending}</span></li>
            {status.failed > 0 ? (
              <li className="text-destructive">Failed: {status.failed}</li>
            ) : null}
            {status.skipped > 0 ? <li>Skipped: {status.skipped}</li> : null}
          </ul>
          {status.runningTitles.length > 0 ? (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {status.runningTitles.slice(0, 2).join(', ')}
              {status.runningTitles.length > 2 ? ` +${status.runningTitles.length - 2}` : ''}
            </p>
          ) : null}
          <button
            type="button"
            onClick={cancel}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/20"
          >
            <Square className="size-3" />
            Stop update
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ProgressBar({ status }: { status: { complete: number; failed: number; skipped: number; total: number } }) {
  const done = status.complete + status.failed + status.skipped;
  const pct = status.total === 0 ? 0 : Math.min(100, Math.round((done / status.total) * 100));
  return (
    <div className="mt-2">
      <div className="h-2 overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full bg-primary shadow-[0_0_10px_var(--accent-cyan)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{pct}%</p>
    </div>
  );
}
