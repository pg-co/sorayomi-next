import { useCallback, useMemo, useState } from 'react';

type LangSource = { lang: string; isNsfw: boolean };

/**
 * Shared language-chip filtering for the browse pages. Owns the selected
 * language, the NSFW-aware per-language counts, the "All" total, and the
 * predicate that filters a source list by NSFW + selected language.
 *
 * The active language is *derived*, never stored-then-corrected: a selection
 * only applies while it still appears in `langs`. So a language that disappears
 * when NSFW is toggled off can never strand the page on an empty list (there is
 * no invalid state to clean up), and toggling NSFW back on restores the prior
 * selection. `matches` is referentially stable so callers can memoize on it.
 */
export function useLanguageFilter<T extends LangSource>(sources: readonly T[], showNsfw: boolean) {
  const [selectedLang, setActiveLang] = useState<string | null>(null);

  const langs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sources) {
      if (!showNsfw && s.isNsfw) continue;
      counts.set(s.lang, (counts.get(s.lang) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [sources, showNsfw]);

  const activeLang =
    selectedLang && langs.some(([lang]) => lang === selectedLang) ? selectedLang : null;

  const totalCount = langs.reduce((n, [, c]) => n + c, 0);

  const matches = useCallback(
    (s: T) => (showNsfw || !s.isNsfw) && (!activeLang || s.lang === activeLang),
    [showNsfw, activeLang],
  );

  return { langs, activeLang, setActiveLang, totalCount, matches };
}
