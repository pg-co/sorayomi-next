import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'urql';
import { READER_CHAPTER_DOC, READER_CHAPTER_LIST_DOC, READER_MANGA_DOC, UPDATE_CHAPTER_DOC } from './queries';
import { flattenChapterPages, preloadImages, useChapterPageLoader } from './use-pages';
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

type LoadedChapter = {
  chapterId: number;
  pages: string[];
};

type StreamState =
  | { status: 'idle'; chapters: LoadedChapter[]; isAppending: false }
  | { status: 'loading'; chapters: LoadedChapter[]; isAppending: false }
  | { status: 'ready'; chapters: LoadedChapter[]; isAppending: boolean }
  | { status: 'error'; chapters: LoadedChapter[]; isAppending: false; message: string };

export function ReaderPage({ chapterId: requestedChapterId }: { chapterId: number }) {
  const navigate = useNavigate();
  const loadChapterPages = useChapterPageLoader();
  const [streamState, setStreamState] = useState<StreamState>({
    status: 'idle',
    chapters: [],
    isAppending: false,
  });
  const [page, setPage] = useState(0);
  const loadSessionRef = useRef(0);
  const sessionRootChapterRef = useRef<number | null>(null);
  const resumeChapterRef = useRef<number | null>(requestedChapterId);
  const startedAtRef = useRef(false);
  const completedChapterIndexRef = useRef(-1);

  const [{ data: requestedChapData, error: requestedChapError }] = useQuery({
    query: READER_CHAPTER_DOC,
    variables: { id: requestedChapterId },
  });

  const streamPages = useMemo(() => flattenChapterPages(streamState.chapters), [streamState.chapters]);
  const activePage = streamPages[Math.min(page, Math.max(0, streamPages.length - 1))] ?? null;
  const activeChapterId = activePage?.chapterId ?? requestedChapterId;

  const [{ data: activeChapData, error: activeChapError }] = useQuery({
    query: READER_CHAPTER_DOC,
    variables: { id: activeChapterId },
    pause: activeChapterId === requestedChapterId,
  });

  const chapData = activeChapterId === requestedChapterId ? requestedChapData : activeChapData;
  const chapError = activeChapterId === requestedChapterId ? requestedChapError : activeChapError;
  const mangaId = requestedChapData?.chapter.mangaId ?? chapData?.chapter.mangaId ?? null;

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
  const isContinuous = settings.mode === 'vertical' || settings.mode === 'horizontal';

  const chapterIds = useMemo(
    () => (chapListData?.chapters.nodes ?? []).map((chapter) => chapter.id),
    [chapListData?.chapters.nodes],
  );
  const chapterIndexById = useMemo(
    () => new Map(chapterIds.map((id, index) => [id, index])),
    [chapterIds],
  );
  const chapterStartPage = useMemo(() => {
    const map = new Map<number, number>();
    let offset = 0;
    for (const chapter of streamState.chapters) {
      map.set(chapter.chapterId, offset);
      offset += chapter.pages.length;
    }
    return map;
  }, [streamState.chapters]);

  const beginSession = useCallback(
    async (rootChapterId: number) => {
      const token = loadSessionRef.current + 1;
      loadSessionRef.current = token;
      sessionRootChapterRef.current = rootChapterId;
      resumeChapterRef.current = rootChapterId;
      startedAtRef.current = false;
      completedChapterIndexRef.current = -1;
      setPage(0);
      setStreamState({ status: 'loading', chapters: [], isAppending: false });

      try {
        const pages = await loadChapterPages(rootChapterId);
        if (loadSessionRef.current !== token) return;
        setStreamState({
          status: 'ready',
          chapters: [{ chapterId: rootChapterId, pages }],
          isAppending: false,
        });
      } catch (error: unknown) {
        if (loadSessionRef.current !== token) return;
        setStreamState({
          status: 'error',
          chapters: [],
          isAppending: false,
          message: error instanceof Error ? error.message : 'Failed to load chapter pages.',
        });
      }
    },
    [loadChapterPages],
  );

  useEffect(() => {
    if (requestedChapterId == null) {
      sessionRootChapterRef.current = null;
      setStreamState({ status: 'idle', chapters: [], isAppending: false });
      return;
    }

    if (!isContinuous && streamState.chapters.length > 1) {
      sessionRootChapterRef.current = null;
    }

    const requestedLoaded = streamState.chapters.some((chapter) => chapter.chapterId === requestedChapterId);
    const discreteReady =
      streamState.chapters.length === 1 && streamState.chapters[0]?.chapterId === requestedChapterId;

    if (isContinuous) {
      if (!requestedLoaded && sessionRootChapterRef.current !== requestedChapterId) {
        void beginSession(requestedChapterId);
      }
      return;
    }

    if (!discreteReady && sessionRootChapterRef.current !== requestedChapterId) {
      void beginSession(requestedChapterId);
    }
  }, [beginSession, isContinuous, requestedChapterId, streamState.chapters]);

  useEffect(() => {
    if (startedAtRef.current) return;
    if (streamState.status !== 'ready' || !requestedChapData) return;
    const firstChapter = streamState.chapters[0];
    if (!firstChapter || firstChapter.chapterId !== resumeChapterRef.current) return;
    const lastPageRead = requestedChapData.chapter.lastPageRead ?? 0;
    if (lastPageRead > 0 && lastPageRead < firstChapter.pages.length) {
      setPage(lastPageRead);
    }
    startedAtRef.current = true;
  }, [requestedChapData, streamState]);

  const totalPages =
    streamState.status === 'ready' ? streamPages.length : requestedChapData?.chapter.pageCount ?? 0;

  const appendNextChapter = useCallback(async () => {
    if (!isContinuous || streamState.status !== 'ready' || streamState.isAppending) return;

    const lastChapterId = streamState.chapters[streamState.chapters.length - 1]?.chapterId;
    const lastChapterIndex = lastChapterId == null ? null : chapterIndexById.get(lastChapterId);
    const nextChapterId =
      lastChapterIndex == null ? null : (chapterIds[lastChapterIndex + 1] ?? null);

    if (
      nextChapterId == null ||
      streamState.chapters.some((chapter) => chapter.chapterId === nextChapterId)
    ) {
      return;
    }

    const token = loadSessionRef.current;
    setStreamState((current) =>
      current.status === 'ready' ? { ...current, isAppending: true } : current,
    );

    try {
      const pages = await loadChapterPages(nextChapterId);
      if (loadSessionRef.current !== token) return;
      setStreamState((current) => {
        if (current.status !== 'ready') return current;
        if (current.chapters.some((chapter) => chapter.chapterId === nextChapterId)) {
          return { ...current, isAppending: false };
        }
        return {
          status: 'ready',
          chapters: [...current.chapters, { chapterId: nextChapterId, pages }],
          isAppending: false,
        };
      });
    } catch (error: unknown) {
      if (loadSessionRef.current !== token) return;
      setStreamState((current) =>
        current.status === 'ready' ? { ...current, isAppending: false } : current,
      );
      toast.error(error instanceof Error ? error.message : 'Failed to append next chapter.');
    }
  }, [chapterIds, chapterIndexById, isContinuous, loadChapterPages, streamState]);

  useEffect(() => {
    if (!isContinuous || streamState.status !== 'ready' || streamPages.length === 0) return;
    if (streamPages.length - page <= 3) {
      void appendNextChapter();
    }
  }, [appendNextChapter, isContinuous, page, streamPages.length, streamState.status]);

  useEffect(() => {
    if (streamState.status !== 'ready') return;
    preloadImages(streamPages.slice(page + 1, page + 4).map((entry) => entry.src));
  }, [page, streamPages, streamState.status]);

  const { prevId, nextId } = useMemo(() => {
    const index = chapterIndexById.get(activeChapterId);
    if (index == null) {
      return { prevId: null, nextId: null };
    }
    return {
      prevId: index > 0 ? chapterIds[index - 1] : null,
      nextId: index < chapterIds.length - 1 ? chapterIds[index + 1] : null,
    };
  }, [activeChapterId, chapterIds, chapterIndexById]);

  useEffect(() => {
    if (!isContinuous || mangaId == null || activeChapterId === requestedChapterId) return;
    navigate({
      to: '/manga/$mangaId/chapter/$chapterId',
      params: { mangaId: String(mangaId), chapterId: String(activeChapterId) },
      replace: true,
    });
  }, [activeChapterId, isContinuous, mangaId, navigate, requestedChapterId]);

  const navTo = useCallback(
    (targetChapterId: number, opts?: { replace?: boolean }) => {
      if (mangaId == null) return;
      const targetStartPage = chapterStartPage.get(targetChapterId);
      if (isContinuous && targetStartPage != null) {
        setPage(targetStartPage);
        navigate({
          to: '/manga/$mangaId/chapter/$chapterId',
          params: { mangaId: String(mangaId), chapterId: String(targetChapterId) },
          replace: opts?.replace ?? true,
        });
        return;
      }
      navigate({
        to: '/manga/$mangaId/chapter/$chapterId',
        params: { mangaId: String(mangaId), chapterId: String(targetChapterId) },
        replace: opts?.replace,
      });
    },
    [chapterStartPage, isContinuous, mangaId, navigate],
  );

  const step = settings.mode === 'double' ? 2 : 1;
  const advance = useCallback(
    (dir: 1 | -1) => {
      const nextPage = page + dir * step;
      if (nextPage < 0) {
        if (prevId != null) {
          const prevStartPage = chapterStartPage.get(prevId);
          if (isContinuous && prevStartPage != null) {
            setPage(prevStartPage);
            return;
          }
          navTo(prevId);
        }
        return;
      }
      if (nextPage >= totalPages) {
        if (nextId != null) {
          const nextStartPage = chapterStartPage.get(nextId);
          if (isContinuous && nextStartPage != null) {
            setPage(nextStartPage);
            return;
          }
          if (isContinuous) {
            void appendNextChapter();
            return;
          }
          navTo(nextId);
        }
        return;
      }
      setPage(nextPage);
    },
    [appendNextChapter, chapterStartPage, isContinuous, navTo, nextId, page, prevId, step, totalPages],
  );

  useProgressSync(activePage?.chapterId ?? null, activePage?.chapterPageIndex ?? 0, activePage?.chapterPageCount ?? 0);

  const [, runUpdate] = useMutation(UPDATE_CHAPTER_DOC);

  useEffect(() => {
    if (!isContinuous || streamState.status !== 'ready' || !activePage) return;
    for (
      let chapterIndex = completedChapterIndexRef.current + 1;
      chapterIndex < activePage.chapterIndex;
      chapterIndex += 1
    ) {
      const chapter = streamState.chapters[chapterIndex];
      if (!chapter || chapter.pages.length === 0) continue;
      runUpdate({
        id: chapter.chapterId,
        lastPageRead: chapter.pages.length - 1,
        isRead: true,
      }).catch(() => {});
    }
    completedChapterIndexRef.current = Math.max(
      completedChapterIndexRef.current,
      activePage.chapterIndex - 1,
    );
  }, [activePage, isContinuous, runUpdate, streamState]);

  const toggleBookmark = useCallback(() => {
    if (!chapData) return;
    runUpdate({
      id: activeChapterId,
      isBookmarked: !chapData.chapter.isBookmarked,
    }).catch(() => {});
  }, [activeChapterId, chapData, runUpdate]);

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
        setChromeVisible((visible) => !visible);
        return;
      }
      const dir = zone === 'next' ? 1 : -1;
      advance(((settings.rtl ? -1 : 1) * dir) as 1 | -1);
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
      {streamState.status === 'loading' || streamState.status === 'idle' ? (
        <LoadingOverlay />
      ) : streamState.status === 'error' ? (
        <div className="grid h-full w-full place-items-center px-6 text-center text-white">
          <div>
            <p className="text-lg font-semibold">Couldn't load pages</p>
            <p className="mt-1 text-sm opacity-80">{streamState.message}</p>
          </div>
        </div>
      ) : settings.mode === 'single' ? (
        <SingleMode
          pages={streamState.chapters[0]?.pages ?? []}
          page={page}
          fit={settings.fit}
          pixelated={settings.pixelated}
          onTapZone={onTapZone}
        />
      ) : settings.mode === 'double' ? (
        <DoubleMode
          pages={streamState.chapters[0]?.pages ?? []}
          page={page}
          fit={settings.fit}
          rtl={settings.rtl}
          pixelated={settings.pixelated}
          onTapZone={onTapZone}
        />
      ) : (
        <ContinuousMode
          pages={streamPages}
          page={page}
          axis={settings.mode === 'vertical' ? 'vertical' : 'horizontal'}
          fit={settings.fit}
          pixelated={settings.pixelated}
          pagePadding={settings.pagePadding}
          onPageChange={setPage}
          onTapZone={onTapZone}
          onEndReached={() => {
            void appendNextChapter();
          }}
        />
      )}

      <ReaderTopBar
        visible={chromeVisible}
        mangaTitle={mangaData?.manga.title ?? ''}
        chapterTitle={chapData?.chapter.name ?? ''}
        mangaId={mangaId ?? 0}
        onSettings={() => setSettingsOpen((visible) => !visible)}
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
