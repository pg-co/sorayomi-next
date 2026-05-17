import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { SideRail } from './side-rail';
import { TopBar } from './top-bar';
import { BottomNav } from './bottom-nav';
import { CommandPalette } from './command-palette';

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let lastShown = 0;
    function onAuthRequired() {
      const now = Date.now();
      // Debounce: one toast per 10 s to avoid spam from multiple concurrent requests.
      if (now - lastShown < 10_000) return;
      lastShown = now;
      toast.error('Server requires authentication. Configure credentials in Settings → Server.', {
        action: { label: 'Settings', onClick: () => navigateRef.current({ to: '/settings' }) },
        duration: 8000,
      });
    }
    window.addEventListener('sorayomi:auth-required', onAuthRequired);
    return () => window.removeEventListener('sorayomi:auth-required', onAuthRequired);
  }, []);

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[auto_1fr]">
      <SideRail className="hidden md:flex" />
      <div className="flex h-full min-w-0 flex-col">
        <TopBar onOpenPalette={() => setPaletteOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
        <BottomNav className="md:hidden" />
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
