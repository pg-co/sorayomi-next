import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES_DOC } from '@/features/library/queries';
import { UPDATE_MANGA_CATEGORIES_DOC } from './queries';
import { cn } from '@/lib/utils';

export function CategoryPicker({
  mangaId,
  currentIds,
  open,
  onClose,
}: {
  mangaId: number;
  currentIds: number[];
  open: boolean;
  onClose: () => void;
}) {
  const [{ data, fetching, error }] = useQuery({ query: CATEGORIES_DOC, pause: !open });
  const [, run] = useMutation(UPDATE_MANGA_CATEGORIES_DOC);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(currentIds));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSelected(new Set(currentIds));
  }, [open, currentIds]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const categories = useMemo(
    () => (data?.categories.nodes ?? []).filter((c) => c.id !== 0),
    [data],
  );

  if (!open) return null;

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    const before = new Set(currentIds);
    const addToCategories: number[] = [];
    const removeFromCategories: number[] = [];
    for (const id of selected) if (!before.has(id)) addToCategories.push(id);
    for (const id of before) if (!selected.has(id)) removeFromCategories.push(id);

    if (addToCategories.length === 0 && removeFromCategories.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const res = await run({ id: mangaId, addToCategories, removeFromCategories });
      if (res.error) toast.error(res.error.message);
      else {
        toast.success('Categories updated');
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-h-[80vh] overflow-hidden border bg-elevated shadow-2xl',
          'rounded-t-2xl md:max-w-md md:rounded-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-display text-lg font-semibold tracking-tight">Categories</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
          {error ? (
            <p className="px-3 py-6 text-center text-sm text-destructive">{error.message}</p>
          ) : fetching && !data ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No categories yet. Create one from the library.
            </p>
          ) : (
            <ul className="flex flex-col">
              {categories.map((cat) => {
                const checked = selected.has(cat.id);
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => toggle(cat.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-accent"
                    >
                      <span
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded border transition',
                          checked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background',
                        )}
                      >
                        {checked ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="flex-1 truncate">{cat.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t bg-background/40 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </footer>
      </div>
    </div>
  );
}
