import { ChevronLeft, ChevronRight, Settings2, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export function ReaderTopBar({
  visible,
  mangaTitle,
  chapterTitle,
  mangaId,
  onSettings,
}: {
  visible: boolean;
  mangaTitle: string;
  chapterTitle: string;
  mangaId: number;
  onSettings: () => void;
}) {
  return (
    <header
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 px-3 py-2 text-white transition',
        'bg-gradient-to-b from-black/70 to-transparent',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <Link
        to="/manga/$mangaId"
        params={{ mangaId: String(mangaId) }}
        className="pointer-events-auto grid size-10 place-items-center rounded-xl bg-black/40 ring-1 ring-white/10 backdrop-blur transition hover:text-primary hover:ring-primary/60 hover:shadow-[0_0_18px_-4px_var(--accent-cyan)]"
        aria-label="Back to manga"
      >
        <X className="size-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs uppercase tracking-wider opacity-70">{mangaTitle}</p>
        <p className="truncate font-display text-sm font-medium">{chapterTitle}</p>
      </div>
      <button
        type="button"
        onClick={onSettings}
        className="pointer-events-auto grid size-10 place-items-center rounded-xl bg-black/40 ring-1 ring-white/10 backdrop-blur transition hover:text-primary hover:ring-primary/60 hover:shadow-[0_0_18px_-4px_var(--accent-cyan)]"
        aria-label="Reader settings"
      >
        <Settings2 className="size-5" />
      </button>
    </header>
  );
}

export function ReaderBottomBar({
  visible,
  page,
  totalPages,
  rtl,
  onPageChange,
  onPrevChapter,
  onNextChapter,
  hasPrevChapter,
  hasNextChapter,
}: {
  visible: boolean;
  page: number;
  totalPages: number;
  rtl: boolean;
  onPageChange: (i: number) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
}) {
  return (
    <footer
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center gap-3 px-3 py-3 text-white transition',
        'bg-gradient-to-t from-black/70 to-transparent',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <ChapterNavButton
        direction="prev"
        rtl={rtl}
        disabled={!hasPrevChapter}
        onClick={onPrevChapter}
      />

      <div className="pointer-events-auto flex flex-1 items-center gap-3 rounded-xl bg-black/40 px-3 py-2 ring-1 ring-white/10 backdrop-blur">
        <span className="min-w-14 text-center font-mono text-xs tabular-nums text-primary">
          {String(page + 1).padStart(2, '0')} / {totalPages ? String(totalPages).padStart(2, '0') : '––'}
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalPages - 1)}
          value={page}
          onChange={(e) => onPageChange(Number(e.target.value))}
          className="flex-1 accent-[var(--primary)]"
          style={rtl ? { direction: 'rtl' } : undefined}
        />
      </div>

      <ChapterNavButton
        direction="next"
        rtl={rtl}
        disabled={!hasNextChapter}
        onClick={onNextChapter}
      />
    </footer>
  );
}

function ChapterNavButton({
  direction,
  rtl,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next';
  rtl: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const isLeft = direction === 'prev' ? !rtl : rtl;
  const Icon = isLeft ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${direction === 'prev' ? 'Previous' : 'Next'} chapter`}
      className={cn(
        'pointer-events-auto grid size-10 place-items-center rounded-xl bg-black/40 ring-1 ring-white/10 backdrop-blur transition',
        disabled
          ? 'opacity-30'
          : 'hover:text-primary hover:ring-primary/60 hover:shadow-[0_0_18px_-4px_var(--accent-cyan)]',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
