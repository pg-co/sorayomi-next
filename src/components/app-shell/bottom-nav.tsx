import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-items';
import { useDownloadStatus } from '@/features/downloads/use-download-status';

export function BottomNav({ className }: { className?: string }) {
  const items = NAV_ITEMS.filter((i) => i.primary);
  const downloads = useDownloadStatus();
  const downloadsCount = downloads.queue.length;
  return (
    <nav
      className={cn(
        'glass-strong fixed inset-x-0 bottom-0 z-30 grid border-x-0 border-b-0',
        'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const showDownloads = item.to === '/more' && downloadsCount > 0;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'group flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors',
              'data-[status=active]:text-primary',
            )}
          >
            <span className="relative grid size-9 place-items-center rounded-xl transition-all group-data-[status=active]:bg-primary/12 group-data-[status=active]:text-primary group-data-[status=active]:shadow-[0_0_16px_-4px_var(--accent-cyan)]">
              <item.icon className="size-5" />
              {showDownloads ? (
                <span className="glow-magenta absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-accent-magenta px-1 font-mono text-[10px] font-semibold tabular-nums text-white">
                  {downloadsCount > 99 ? '99+' : downloadsCount}
                </span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
