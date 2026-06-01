import { Link } from '@tanstack/react-router';
import { CloudDownload } from 'lucide-react';
import { AuthImage } from '@/components/auth-image';
import { mangaThumbnailUrl } from '@/lib/rest/client';
import { cn } from '@/lib/utils';

export type MangaCardData = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  unreadCount: number;
  downloadCount: number;
};

export function MangaCard({ manga, className }: { manga: MangaCardData; className?: string }) {
  return (
    <Link
      to="/manga/$mangaId"
      params={{ mangaId: String(manga.id) }}
      className={cn(
        'group relative block overflow-hidden rounded-xl bg-elevated ring-1 ring-glass-border transition-all duration-300',
        'hover:-translate-y-1 hover:ring-primary/70 hover:shadow-[0_8px_30px_-8px_var(--accent-cyan)]',
        className,
      )}
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
        <AuthImage
          src={mangaThumbnailUrl(manga.id)}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
          }}
        />
      </div>

      {/* Cyan scanline sweep on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:via-primary/5 group-hover:to-primary/15 group-hover:opacity-100" />

      {/* Badges */}
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
        {manga.unreadCount > 0 ? (
          <span
            className="rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-primary-foreground shadow-[0_0_12px_-2px_var(--accent-cyan)]"
            style={{ backgroundColor: 'var(--unread)' }}
          >
            {manga.unreadCount}
          </span>
        ) : null}
        {manga.downloadCount > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-white shadow-[0_0_12px_-2px_var(--downloaded)]"
            style={{ backgroundColor: 'var(--downloaded)' }}
          >
            <CloudDownload className="size-3" />
            {manga.downloadCount}
          </span>
        ) : null}
      </div>

      {/* Title gradient */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-2.5 pt-10">
        <p className="line-clamp-2 text-[13px] font-medium leading-tight text-white">{manga.title}</p>
      </div>
    </Link>
  );
}
