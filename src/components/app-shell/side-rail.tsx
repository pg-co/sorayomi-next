import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { APP_BRAND_ICON, NAV_ITEMS } from './nav-items';
import { useDownloadStatus } from '@/features/downloads/use-download-status';

export function SideRail({ className }: { className?: string }) {
  const downloads = useDownloadStatus();
  const counts: Partial<Record<string, number>> = { '/downloads': downloads.queue.length };

  return (
    <aside
      className={cn(
        'sticky top-0 z-20 h-screen w-[72px] flex-col items-center gap-1 border-r bg-rail py-4',
        'lg:w-56 lg:items-stretch lg:px-3',
        className,
      )}
    >
      <Link
        to="/library"
        className="mb-3 flex items-center gap-2 px-2 text-base font-semibold tracking-tight"
      >
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <APP_BRAND_ICON className="size-5" />
        </span>
        <span className="hidden lg:inline font-display">sorayomi</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.filter((i) => i.to !== '/more').map((item) => {
          const count = counts[item.to] ?? 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-muted-foreground transition',
                'hover:bg-accent hover:text-foreground',
                'data-[status=active]:bg-accent data-[status=active]:text-foreground',
              )}
              activeOptions={{ exact: false }}
            >
              <span className="relative grid size-9 place-items-center rounded-lg group-data-[status=active]:bg-primary group-data-[status=active]:text-primary-foreground">
                <item.icon className="size-5" />
                {count > 0 ? <CountDot count={count} /> : null}
              </span>
              <span className="hidden lg:inline">{item.label}</span>
              {count > 0 ? (
                <span className="ml-auto hidden lg:inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function CountDot({ count }: { count: number }) {
  return (
    <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground ring-2 ring-rail lg:hidden">
      {count > 99 ? '99+' : count}
    </span>
  );
}
