import { useMatches } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const matches = useMatches();
  const title = pageTitleFor(matches.at(-1)?.routeId);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>
      <button
        type="button"
        onClick={onOpenPalette}
        className="ml-auto inline-flex h-9 min-w-56 items-center gap-2 rounded-xl border bg-elevated px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Search className="size-4" />
        <span>Search…</span>
        <kbd className="ml-auto text-[10px] uppercase tracking-wider opacity-70">⌘K</kbd>
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
