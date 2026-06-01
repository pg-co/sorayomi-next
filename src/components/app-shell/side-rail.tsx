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
        'glass sticky top-0 z-20 h-screen w-[76px] flex-col items-center gap-1 border-y-0 border-l-0 py-4',
        'lg:w-60 lg:items-stretch lg:px-3',
        className,
      )}
    >
      <Link
        to="/library"
        className="mb-4 flex items-center gap-2.5 px-2 text-base font-semibold tracking-tight"
      >
        <span className="glow-cyan grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <APP_BRAND_ICON className="size-5" />
        </span>
        <span className="hidden font-display text-lg lowercase text-glow-cyan lg:inline">
          sorayomi
        </span>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.filter((i) => i.to !== '/more').map((item) => {
          const count = counts[item.to] ?? 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-muted-foreground transition-colors',
                'hover:bg-accent/40 hover:text-foreground',
                'data-[status=active]:bg-accent/50 data-[status=active]:text-foreground',
              )}
              activeOptions={{ exact: false }}
            >
              {/* Neon active rail */}
              <span className="absolute left-0 top-1/2 hidden h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow-[0_0_12px_var(--accent-cyan)] transition-opacity group-data-[status=active]:opacity-100 lg:block" />
              <span className="relative grid size-9 place-items-center rounded-lg transition-all group-data-[status=active]:bg-primary group-data-[status=active]:text-primary-foreground group-data-[status=active]:shadow-[0_0_18px_-4px_var(--accent-cyan)]">
                <item.icon className="size-5" />
                {count > 0 ? <CountDot count={count} /> : null}
              </span>
              <span className="hidden lg:inline">{item.label}</span>
              {count > 0 ? (
                <span className="ml-auto hidden min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[11px] font-semibold tabular-nums text-primary-foreground lg:inline-flex">
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
    <span className="glow-magenta absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-accent-magenta px-1 font-mono text-[10px] font-semibold tabular-nums text-white lg:hidden">
      {count > 99 ? '99+' : count}
    </span>
  );
}
