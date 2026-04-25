import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'urql';
import { LibraryBig, Plus, RefreshCcw } from 'lucide-react';
import { CATEGORIES_DOC, CATEGORY_MANGAS_DOC } from './queries';
import { MangaCard } from './manga-card';
import { LibraryUpdateButton } from '@/features/updates/library-update-button';
import { cn } from '@/lib/utils';

export function LibraryPage() {
  const [{ data: catData, fetching: catFetching, error: catError }, reloadCats] = useQuery({
    query: CATEGORIES_DOC,
  });

  const categories = useMemo(() => catData?.categories.nodes ?? [], [catData]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const effectiveActiveId = activeId ?? categories[0]?.id ?? null;

  return (
    <div className="px-4 py-6 md:px-8">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Library</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your saved manga, organised into categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => reloadCats({ requestPolicy: 'network-only' })}
            aria-label="Refresh"
            className="inline-flex items-center gap-2 rounded-xl border bg-elevated p-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:px-3 sm:py-2"
          >
            <RefreshCcw className={cn('size-4', catFetching && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <LibraryUpdateButton />
          <Link
            to="/browse"
            aria-label="Add manga"
            className="inline-flex items-center gap-2 rounded-xl bg-primary p-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95 sm:px-3 sm:py-2"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add manga</span>
          </Link>
        </div>
      </header>

      {catError ? <ConnectionErrorState message={catError.message} /> : null}

      {!catError && categories.length > 0 ? (
        <>
          <CategoryTabs
            categories={categories}
            activeId={effectiveActiveId}
            onSelect={setActiveId}
          />
          {effectiveActiveId !== null ? <CategoryGrid categoryId={effectiveActiveId} /> : null}
        </>
      ) : null}

      {!catError && !catFetching && categories.length === 0 ? <EmptyState /> : null}
    </div>
  );
}

function CategoryTabs({
  categories,
  activeId,
  onSelect,
}: {
  categories: ReadonlyArray<{ id: number; name: string }>;
  activeId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="sticky top-0 z-10 mb-4 flex gap-1 overflow-x-auto border-b bg-background/80 pb-px backdrop-blur scrollbar-thin">
      {categories.map((cat) => {
        const active = cat.id === activeId;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              'relative whitespace-nowrap px-3 py-2 text-sm font-medium transition',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {cat.name}
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function CategoryGrid({ categoryId }: { categoryId: number }) {
  const [{ data, fetching, error }] = useQuery({
    query: CATEGORY_MANGAS_DOC,
    variables: { id: categoryId },
  });

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error.message}
      </p>
    );
  }

  if (fetching && !data) {
    return <GridSkeleton />;
  }

  const mangas = data?.category.mangas.nodes ?? [];
  if (mangas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-elevated/40 px-4 py-12 text-center text-sm text-muted-foreground">
        No manga in this category yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 md:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
      {mangas.map((m) => (
        <MangaCard key={m.id} manga={m} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 md:gap-4 lg:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-elevated" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed bg-elevated/40 px-6 py-24 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <LibraryBig className="size-7" />
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight">Your library is empty</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Once you add manga from a source, they'll show up here.
      </p>
      <Link
        to="/browse"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
      >
        Browse sources
      </Link>
    </div>
  );
}

function ConnectionErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
      <h3 className="font-display text-lg font-semibold text-destructive">Couldn't reach the server</h3>
      <p className="mt-1 text-sm text-destructive/90">{message}</p>
      <Link
        to="/settings"
        className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm font-medium transition hover:bg-accent"
      >
        Configure server
      </Link>
    </div>
  );
}
