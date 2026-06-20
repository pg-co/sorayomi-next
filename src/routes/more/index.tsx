import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from '@/components/app-shell/nav-items';
import { useDownloadStatus } from '@/features/downloads/use-download-status';

export const Route = createFileRoute('/more/')({
  component: MorePage,
});

function MorePage() {
  const items = NAV_ITEMS.filter((i) => !i.primary && i.to !== '/more');
  const downloads = useDownloadStatus();
  const counts: Partial<Record<string, number>> = { '/downloads': downloads.queue.length };

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="reveal mb-4">
        <h2 className="font-display text-3xl font-semibold uppercase tracking-tight">More</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Settings, downloads, and other tools.
        </p>
      </header>

      <ul className="glass divide-y divide-glass-border overflow-hidden rounded-2xl">
        {items.map((item) => {
          const count = counts[item.to] ?? 0;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className="group/more flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background/60 text-muted-foreground transition-colors group-hover/more:text-primary">
                  <item.icon className="size-5" />
                </span>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {count > 0 ? (
                  <span className="glow-cyan inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[11px] font-semibold tabular-nums text-primary-foreground">
                    {count}
                  </span>
                ) : null}
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover/more:translate-x-0.5 group-hover/more:text-primary" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
