import { createFileRoute } from '@tanstack/react-router';
import { GlobalSearchPage } from '@/features/browse/global-search-page';

type SearchParams = { q?: string };

export const Route = createFileRoute('/browse/search/')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  component: GlobalSearchRoute,
});

function GlobalSearchRoute() {
  const { q } = Route.useSearch();
  return <GlobalSearchPage query={q ?? ''} />;
}
