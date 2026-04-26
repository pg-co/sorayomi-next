import { useCallback, useEffect, useState } from 'react';
import { useMutation } from 'urql';
import { FETCH_CHAPTER_PAGES_DOC } from './queries';
import { resolveUrl } from '@/lib/server-config';

export type ReaderStreamPage = {
  key: string;
  src: string;
  chapterId: number;
  chapterIndex: number;
  chapterPageIndex: number;
  chapterPageCount: number;
};

export type PagesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; pages: string[] }
  | { status: 'error'; message: string };

export function useChapterPageLoader() {
  const [, run] = useMutation(FETCH_CHAPTER_PAGES_DOC);

  return useCallback(
    async (chapterId: number) => {
      const res = await run({ chapterId });
      if (res.error) {
        throw res.error;
      }
      return (res.data?.fetchChapterPages?.pages ?? []).map((page) => resolveUrl(page));
    },
    [run],
  );
}

export function useChapterPages(chapterId: number | null): PagesState {
  const loadChapterPages = useChapterPageLoader();
  const [state, setState] = useState<PagesState>({ status: 'idle' });

  useEffect(() => {
    if (chapterId == null) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    loadChapterPages(chapterId)
      .then((pages) => {
        if (cancelled) return;
        setState({ status: 'ready', pages });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load chapter pages.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [chapterId, loadChapterPages]);

  return state;
}

export function flattenChapterPages(
  chapters: ReadonlyArray<{ chapterId: number; pages: ReadonlyArray<string> }>,
): ReaderStreamPage[] {
  return chapters.flatMap((chapter, chapterIndex) =>
    chapter.pages.map((src, chapterPageIndex) => ({
      key: `${chapter.chapterId}:${chapterPageIndex}`,
      src,
      chapterId: chapter.chapterId,
      chapterIndex,
      chapterPageIndex,
      chapterPageCount: chapter.pages.length,
    })),
  );
}

export function preloadImages(urls: string[]) {
  for (const url of urls) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}
