import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'urql';
import { READER_CHAPTER_DOC, READER_CHAPTER_LIST_DOC, READER_MANGA_DOC, UPDATE_CHAPTER_DOC } from './queries';
import { preloadImages, useChapterPages } from './use-pages';
import { useProgressSync } from './use-progress-sync';
import { useReaderKeyboard } from './use-keyboard';
import { readSettingsFromMeta, useReaderSettings } from './reader-settings-store';
import { SingleMode } from './modes/single';
import { DoubleMode } from './modes/double';
import { ContinuousMode } from './modes/continuous';
import { ReaderBottomBar, ReaderTopBar } from './reader-controls';
import { ReaderSettingsPanel } from './reader-settings';
import { cn } from '@/lib/utils';

const BG_CLASS = { black: 'bg-black', gray: 'bg-zinc-700', white: 'bg-white' } as const;

export function ReaderPage({ chapterId }: { chapterId: number }) {
  const navigate = useNavigate();
  const [{ data: chapData, error: chapError }] = useQuery({
    query: READER_CHAPTER_DOC,
    variables: { id: chapterId },
  });
  const mangaId = chapData?.chapter.mangaId ?? null;

  const [{ data: mangaData }] = useQuery({
    query: READER_MANGA_DOC,
    variables: { id: mangaId ?? 0 },
    pause: mangaId == null,
  });
  const [{ data: chapListData }] = useQuery({
    query: READER_CHAPTER_LIST_DOC,
    variables: { mangaId: mangaId ?? 0 },
    pause: mangaId == null,
  });

  const initialSettings = useMemo(
    () => readSettingsFromMeta(mangaData?.manga.meta),
    [mangaData?.manga.meta],
  );
  const [settings, updateSettings] = useReaderSettings(mangaId, initialSettings);

  const pagesState = useChapterPages(chapterId);
  const totalPages = pagesState.status === 'ready' ? pagesState.pages.length : chapData?.chapter.pageCount ?? 0;

  const [page, setPage] = useState(0);
  const startedAtRef = useRef(false);
  // Resume to last-read page on first ready render.
  useEffect(() => {
    if (startedAtRef.current) return;
    if (pagesState.status !== 'ready' || !chapData) return;
    const last = chapData.chapter.lastPageRead ?? 0;
    if (last > 0 && last < pagesState.pages.length) setPage(last);
    startedAtRef.current = true;
  }, [pagesState, chapData]);

  // Reset on chapter change.
  useEffect(() => {
    startedAtRef.current = false;
    setPage(0);
  }, [chapterId]);

  useProgressSync(chapterId, page, totalPages);

  // Prefetch the next 3 pages.
  useEffect(() => {
    if (pagesState.status !== 'ready') return;
    preloadImages(pagesState.pages.slice(page + 1, page + 4));
  }, [pagesState, page]);

  const { prevId, nextId } = useMemo(() => {
    const list = chapListData?.chapters.nodes ?? [];
    const idx = list.findIndex((c) => c.id === chapterId);
    return {
      prevId: idx > 0 ? list[idx - 1].id : null,
      nextId: idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : null,
    };
  }, [chapListData, chapterId]);

  const navTo = useCallback(
    (targetChapterId: number) => {
      if (mangaId == null) return;
      navigate({
        to: '/manga/$mangaId/chapter/$chapterId',
        params: { mangaId: String(mangaId), chapterId: String(targetChapterId) },
      });
    },
    [mangaId, navigate],
  );

  const step = settings.mode === 'double' ? 2 : 1;
  const advance = useCallback(
    (dir: 1 | -1) => {
      const nextPage = page + dir * step;
      if (nextPage < 0) {
        if (prevId != null) navTo(prevId);
        return;
      }
      if (nextPage >= totalPages) {
        if (nextId != null) navTo(nextId);
        return;
      }
      setPage(nextPage);
    },
    [page, step, totalPages, prevId, nextId, navTo],
  );

  const [, runUpdate] = useMutation(UPDATE_CHAPTER_DOC);
  const toggleBookmark = useCallback(() => {
    if (!chapData) return;
    runUpdate({ id: chapterId, isBookmarked: !chapData.chapter.isBookmarked }).catch(() => {});
  }, [chapData, chapterId, runUpdate]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  useReaderKeyboard({
    next: () => advance(settings.rtl ? -1 : 1),
    prev: () => advance(settings.rtl ? 1 : -1),
    nextChapter: () => nextId != null && navTo(nextId),
    prevChapter: () => prevId != null && navTo(prevId),
    toggleFullscreen,
    toggleBookmark,
    exit: () => {
      if (mangaId != null) navigate({ to: '/manga/$mangaId', params: { mangaId: String(mangaId) } });
    },
  });

  // Auto-hiding overlay
  const [chromeVisible, setChromeVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);
  const showChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChromeVisible(false), 2500);
  }, []);
  useEffect(() => {
    showChrome();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [showChrome, page]);

  const onTapZone = useCallback(
    (zone: 'prev' | 'next' | 'center') => {
      if (zone === 'center') {
        setChromeVisible((v) => !v);
        return;
      }
      const dir = zone === 'next' ? 1 : -1;
      advance((settings.rtl ? -1 : 1) * dir as 1 | -1);
    },
    [advance, settings.rtl],
  );

  const [settingsOpen, setSettingsOpen] = useState(false);

  if (chapError) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black p-6 text-center text-white">
        <div>
          <p className="text-lg font-semibold">Couldn't load chapter</p>
          <p className="mt-1 text-sm opacity-80">{chapError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('fixed inset-0 z-50 overflow-hidden', BG_CLASS[settings.bg])}
      onMouseMove={showChrome}
    >
      {pagesState.status === 'loading' || pagesState.status === 'idle' ? (
        <LoadingOverlay />
      ) : pagesState.status === 'error' ? (
        <div className="grid h-full w-full place-items-center px-6 text-center text-white">
          <div>
            <p className="text-lg font-semibold">Couldn't load pages</p>
            <p className="mt-1 text-sm opacity-80">{pagesState.message}</p>
          </div>
        </div>
      ) : settings.mode === 'single' ? (
        <SingleMode
          pages={pagesState.pages}
          page={page}
          fit={settings.fit}
          pixelated={settings.pixelated}
          onTapZone={onTapZone}
        />
      ) : settings.mode === 'double' ? (
        <DoubleMode
          pages={pagesState.pages}
          page={page}
          fit={settings.fit}
          rtl={settings.rtl}
          pixelated={settings.pixelated}
          onTapZone={onTapZone}
        />
      ) : (
        <ContinuousMode
          pages={pagesState.pages}
          page={page}
          axis={settings.mode === 'vertical' ? 'vertical' : 'horizontal'}
          fit={settings.fit}
          pixelated={settings.pixelated}
          pagePadding={settings.pagePadding}
          onPageChange={setPage}
          onTapZone={onTapZone}
          onEndReached={() => {
            if (nextId != null) navTo(nextId);
          }}
        />
      )}

      <ReaderTopBar
        visible={chromeVisible}
        mangaTitle={mangaData?.manga.title ?? ''}
        chapterTitle={chapData?.chapter.name ?? ''}
        mangaId={mangaId ?? 0}
        onSettings={() => setSettingsOpen((v) => !v)}
      />
      <ReaderBottomBar
        visible={chromeVisible}
        page={page}
        totalPages={totalPages}
        rtl={settings.rtl}
        onPageChange={setPage}
        onPrevChapter={() => prevId != null && navTo(prevId)}
        onNextChapter={() => nextId != null && navTo(nextId)}
        hasPrevChapter={prevId != null}
        hasNextChapter={nextId != null}
      />

      {settingsOpen ? (
        <ReaderSettingsPanel
          settings={settings}
          onChange={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="grid h-full w-full place-items-center text-white/70">
      <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}
