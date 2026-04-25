import { createFileRoute } from '@tanstack/react-router';
import { ReaderPage } from '@/features/reader/reader-page';

export const Route = createFileRoute('/manga/$mangaId/chapter/$chapterId')({
  component: ReaderRoute,
});

function ReaderRoute() {
  const { chapterId } = Route.useParams();
  const id = Number(chapterId);
  if (!Number.isFinite(id)) {
    return <p className="p-6 text-sm text-muted-foreground">Invalid chapter id.</p>;
  }
  return <ReaderPage chapterId={id} />;
}
