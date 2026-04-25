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
        'fixed inset-x-0 bottom-0 z-30 grid border-t bg-rail/95 backdrop-blur',
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
              'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition',
              'data-[status=active]:text-primary',
            )}
          >
            <span className="relative">
              <item.icon className="size-5" />
              {showDownloads ? (
                <span className="absolute -right-2 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground ring-2 ring-rail">
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
