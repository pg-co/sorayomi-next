import { createFileRoute } from '@tanstack/react-router';
import { SourceBrowsePage } from '@/features/browse/source-browse-page';

type SourceBrowseSearch = { q?: string };

export const Route = createFileRoute('/browse/source/$sourceId/')({
  validateSearch: (s: Record<string, unknown>): SourceBrowseSearch => ({
    q: typeof s.q === 'string' ? s.q : undefined,
  }),
  component: SourceBrowseRoute,
});

function SourceBrowseRoute() {
  const { sourceId } = Route.useParams();
  const { q } = Route.useSearch();
  return <SourceBrowsePage sourceId={sourceId} initialQuery={q} />;
}
