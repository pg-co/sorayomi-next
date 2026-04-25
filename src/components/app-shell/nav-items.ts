import { BookOpen, CloudDownload, Compass, History, LibraryBig, MoreHorizontal, Settings, Sparkles } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export type NavItem = {
  to: '/library' | '/updates' | '/history' | '/browse' | '/downloads' | '/settings' | '/more';
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Show on the mobile bottom-nav (5 slots max). */
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: '/library', label: 'Library', icon: LibraryBig, primary: true },
  { to: '/updates', label: 'Updates', icon: Sparkles, primary: true },
  { to: '/history', label: 'History', icon: History, primary: true },
  { to: '/browse', label: 'Browse', icon: Compass, primary: true },
  { to: '/downloads', label: 'Downloads', icon: CloudDownload },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/more', label: 'More', icon: MoreHorizontal, primary: true },
];

export const APP_BRAND_ICON = BookOpen;
