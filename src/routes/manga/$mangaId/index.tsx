import { createFileRoute } from '@tanstack/react-router';
import { MangaDetailPage } from '@/features/manga-detail/manga-detail-page';

export const Route = createFileRoute('/manga/$mangaId/')({
  component: MangaDetailRoute,
});

function MangaDetailRoute() {
  const { mangaId } = Route.useParams();
  const id = Number(mangaId);
  if (!Number.isFinite(id)) return <p className="p-6 text-sm text-muted-foreground">Invalid manga id.</p>;
  return <MangaDetailPage mangaId={id} />;
}
