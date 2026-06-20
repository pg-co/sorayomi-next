import { useMatches } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const matches = useMatches();
  const title = pageTitleFor(matches.at(-1)?.routeId);

  return (
    <header className="glass sticky top-0 z-10 flex h-14 items-center gap-3 border-x-0 border-t-0 px-4">
      <h1 className="flex items-center gap-2.5 font-display text-lg font-semibold uppercase tracking-tight">
        <span className="h-4 w-0.5 rounded-full bg-primary shadow-[0_0_10px_var(--accent-cyan)]" />
        {title}
      </h1>
      <button
        type="button"
        onClick={onOpenPalette}
        className="ml-auto inline-flex h-9 min-w-56 items-center gap-2 rounded-xl border border-glass-border bg-elevated/40 px-3 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground hover:shadow-[0_0_16px_-6px_var(--accent-cyan)]"
      >
        <Search className="size-4" />
        <span>Search…</span>
        <kbd className="ml-auto rounded border border-glass-border bg-background/40 px-1.5 py-0.5 font-mono text-[10px] tracking-wider opacity-70">
          ⌘K
        </kbd>
      </button>
      <ThemeToggle />
    </header>
  );
}

function pageTitleFor(routeId: string | undefined): string {
  if (!routeId) return 'sorayomi';
  if (routeId.includes('/library')) return 'Library';
  if (routeId.includes('/updates')) return 'Updates';
  if (routeId.includes('/history')) return 'History';
  if (routeId.includes('/browse')) return 'Browse';
  if (routeId.includes('/downloads')) return 'Downloads';
  if (routeId.includes('/manga')) return 'Manga';
  if (routeId.includes('/settings')) return 'Settings';
  if (routeId.includes('/more')) return 'More';
  return 'sorayomi';
}
