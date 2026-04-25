import { useEffect } from 'react';

export type KeyboardActions = {
  next: () => void;
  prev: () => void;
  nextChapter: () => void;
  prevChapter: () => void;
  toggleFullscreen: () => void;
  toggleBookmark: () => void;
  exit: () => void;
};

export function useReaderKeyboard(actions: KeyboardActions, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          actions.prev();
          break;
        case 'ArrowRight':
        case ' ':
          if (e.shiftKey) {
            e.preventDefault();
            actions.prev();
          } else {
            e.preventDefault();
            actions.next();
          }
          break;
        case 'n':
        case 'N':
          actions.nextChapter();
          break;
        case 'p':
        case 'P':
          actions.prevChapter();
          break;
        case 'b':
        case 'B':
          actions.toggleBookmark();
          break;
        case 'f':
        case 'F':
          actions.toggleFullscreen();
          break;
        case 'Escape':
          actions.exit();
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, enabled]);
}
