import { createFileRoute } from '@tanstack/react-router';
import { SourceBrowsePage } from '@/features/browse/source-browse-page';

export const Route = createFileRoute('/browse/source/$sourceId/')({
  component: SourceBrowseRoute,
});

function SourceBrowseRoute() {
  const { sourceId } = Route.useParams();
  return <SourceBrowsePage sourceId={sourceId} />;
}
