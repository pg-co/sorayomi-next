import { useNavigate } from '@tanstack/react-router';
import { Command } from 'cmdk';
import {
  CloudDownload,
  Compass,
  History,
  LibraryBig,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'urql';
import { AuthImage } from '@/components/auth-image';
import { cn } from '@/lib/utils';
import { mangaThumbnailUrl } from '@/lib/rest/client';
import { PALETTE_LIBRARY_SEARCH_DOC } from './palette-search-queries';

type PaletteAction = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof LibraryBig;
  perform: () => void;
};

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // Reset query when palette closes.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDebounced('');
    }
  }, [open]);

  // Debounce query for downstream search (300ms).
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const searching = debounced.length >= 2;
  const likePattern = useMemo(
    () => (searching ? `%${escapeLike(debounced)}%` : ''),
    [searching, debounced],
  );

  const [{ data, fetching }] = useQuery({
    query: PALETTE_LIBRARY_SEARCH_DOC,
    variables: { q: likePattern },
    pause: !searching,
  });

  const actions: PaletteAction[] = [
    { id: 'go-library', label: 'Go to Library', icon: LibraryBig, perform: () => navigate({ to: '/library' }) },
    { id: 'go-updates', label: 'Go to Updates', icon: Sparkles, perform: () => navigate({ to: '/updates' }) },
    { id: 'go-history', label: 'Go to History', icon: History, perform: () => navigate({ to: '/history' }) },
    { id: 'go-browse', label: 'Browse Sources', icon: Compass, perform: () => navigate({ to: '/browse' }) },
    { id: 'go-downloads', label: 'Downloads', icon: CloudDownload, perform: () => navigate({ to: '/downloads' }) },
    { id: 'go-settings', label: 'Settings', icon: Settings, perform: () => navigate({ to: '/settings' }) },
  ];

  if (!open) return null;
  const libraryHits = data?.mangas.nodes ?? [];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start bg-black/40 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          'mx-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-elevated shadow-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" className="flex flex-col" shouldFilter={!searching}>
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search manga, sources, actions…"
            className="h-12 w-full border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              {searching && fetching ? 'Searching…' : 'No results.'}
            </Command.Empty>

            {searching ? (
              <>
                <Command.Group
                  heading="Library"
                  className="text-xs uppercase tracking-wider text-muted-foreground"
                >
                  {libraryHits.length === 0 && !fetching ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No library matches.
                    </p>
                  ) : (
                    libraryHits.map((m) => (
                      <Command.Item
                        key={m.id}
                        value={`library-${m.id}-${m.title}`}
                        onSelect={() => {
                          navigate({ to: '/manga/$mangaId', params: { mangaId: String(m.id) } });
                          onOpenChange(false);
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-accent"
                      >
                        <AuthImage
                          src={mangaThumbnailUrl(m.id)}
                          alt=""
                          className="size-8 shrink-0 rounded object-cover ring-1 ring-border"
                        />
                        <span className="truncate">{m.title}</span>
                      </Command.Item>
                    ))
                  )}
                </Command.Group>

                <Command.Group
                  heading="Sources"
                  className="text-xs uppercase tracking-wider text-muted-foreground"
                >
                  <Command.Item
                    value={`source-search-${debounced}`}
                    onSelect={() => {
                      navigate({ to: '/browse/search', search: { q: debounced } });
                      onOpenChange(false);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-accent"
                  >
                    <Search className="size-4 text-muted-foreground" />
                    <span>Search sources for “{debounced}”</span>
                  </Command.Item>
                </Command.Group>
              </>
            ) : (
              <Command.Group heading="Navigate" className="text-xs uppercase tracking-wider text-muted-foreground">
                {actions.map((a) => (
                  <Command.Item
                    key={a.id}
                    value={a.label}
                    onSelect={() => {
                      a.perform();
                      onOpenChange(false);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground data-[selected=true]:bg-accent"
                  >
                    <a.icon className="size-4 text-muted-foreground" />
                    <span>{a.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
