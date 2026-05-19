import { createFileRoute } from '@tanstack/react-router';
import { SourceBrowsePage } from '@/features/browse/source-browse-page';
import { FetchSourceMangaType } from '@/lib/graphql/__generated__/graphql';

type SourceSearch = { tab?: FetchSourceMangaType; q?: string };

const validTabs = new Set<string>(Object.values(FetchSourceMangaType));

export const Route = createFileRoute('/browse/source/$sourceId/')({
  validateSearch: (search: Record<string, unknown>): SourceSearch => ({
    tab:
      typeof search.tab === 'string' && validTabs.has(search.tab)
        ? (search.tab as FetchSourceMangaType)
        : undefined,
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  component: SourceBrowseRoute,
});

function SourceBrowseRoute() {
  const { sourceId } = Route.useParams();
  const { tab, q } = Route.useSearch();
  return <SourceBrowsePage sourceId={sourceId} initialTab={tab} initialQuery={q} />;
}
