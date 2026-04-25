import { useEffect, useState } from 'react';
import { useMutation } from 'urql';
import { FETCH_CHAPTER_PAGES_DOC } from './queries';
import { resolveUrl } from '@/lib/server-config';

export type PagesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; pages: string[] }
  | { status: 'error'; message: string };

export function useChapterPages(chapterId: number | null): PagesState {
  const [, run] = useMutation(FETCH_CHAPTER_PAGES_DOC);
  const [state, setState] = useState<PagesState>({ status: 'idle' });

  useEffect(() => {
    if (chapterId == null) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    run({ chapterId }).then((res) => {
      if (cancelled) return;
      if (res.error) {
        setState({ status: 'error', message: res.error.message });
        return;
      }
      const pages = res.data?.fetchChapterPages?.pages ?? [];
      setState({ status: 'ready', pages: pages.map((p) => resolveUrl(p)) });
    });
    return () => {
      cancelled = true;
    };
  }, [chapterId, run]);

  return state;
}

export function preloadImages(urls: string[]) {
  for (const url of urls) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}
