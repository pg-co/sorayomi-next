import { createFileRoute } from '@tanstack/react-router';
import { GlobalSearchPage } from '@/features/browse/global-search-page';

type GlobalSearchSearch = { q?: string };

export const Route = createFileRoute('/browse/search/')({
  validateSearch: (s: Record<string, unknown>): GlobalSearchSearch => ({
    q: typeof s.q === 'string' ? s.q : undefined,
  }),
  component: GlobalSearchRoute,
});

function GlobalSearchRoute() {
  const { q } = Route.useSearch();
  return <GlobalSearchPage initialQuery={q} />;
}
