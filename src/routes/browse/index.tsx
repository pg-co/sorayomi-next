import { createFileRoute } from '@tanstack/react-router';
import { SourcesPage } from '@/features/browse/sources-page';

type BrowseSearch = { q?: string };

export const Route = createFileRoute('/browse/')({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  component: SourcesRouteComponent,
});

function SourcesRouteComponent() {
  const { q } = Route.useSearch();
  return <SourcesPage initialFilter={q} />;
}
