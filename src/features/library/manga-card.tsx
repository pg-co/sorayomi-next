import { Link } from '@tanstack/react-router';
import { CloudDownload } from 'lucide-react';
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
        'group relative block overflow-hidden rounded-2xl bg-elevated shadow-sm ring-1 ring-border transition',
        'hover:ring-primary/60 hover:shadow-lg',
        className,
      )}
    >
      <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
        <img
          src={mangaThumbnailUrl(manga.id)}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
          }}
        />
      </div>

      {/* Badges */}
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
        {manga.unreadCount > 0 ? (
          <span
            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow"
            style={{ backgroundColor: 'var(--unread)' }}
          >
            {manga.unreadCount}
          </span>
        ) : null}
        {manga.downloadCount > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white shadow"
            style={{ backgroundColor: 'var(--downloaded)' }}
          >
            <CloudDownload className="size-3" />
            {manga.downloadCount}
          </span>
        ) : null}
      </div>

      {/* Title gradient */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-10">
        <p className="line-clamp-2 text-[13px] font-medium leading-tight text-white">{manga.title}</p>
      </div>
    </Link>
  );
}
