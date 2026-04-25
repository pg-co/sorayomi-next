import { useEffect, useRef } from 'react';
import { useMutation } from 'urql';
import { UPDATE_CHAPTER_DOC } from './queries';

/**
 * Debounced server sync of `lastPageRead`. The reader updates local page state at
 * 60fps via tap/scroll; we only push to the server after the user has settled on
 * a page for ~1s. When the last page is reached, isRead is flipped immediately.
 */
export function useProgressSync(chapterId: number | null, page: number, totalPages: number) {
  const [, run] = useMutation(UPDATE_CHAPTER_DOC);
  const lastSentRef = useRef<{ chapterId: number; page: number } | null>(null);

  useEffect(() => {
    if (chapterId == null || totalPages === 0) return;
    const isLast = page >= totalPages - 1;

    if (lastSentRef.current?.chapterId === chapterId && lastSentRef.current.page === page) {
      return;
    }

    if (isLast) {
      lastSentRef.current = { chapterId, page };
      run({ id: chapterId, lastPageRead: page, isRead: true }).catch(() => {});
      return;
    }

    const handle = window.setTimeout(() => {
      lastSentRef.current = { chapterId, page };
      run({ id: chapterId, lastPageRead: page }).catch(() => {});
    }, 1000);
    return () => window.clearTimeout(handle);
  }, [chapterId, page, totalPages, run]);
}
