import { useMemo } from 'react';
import { useQuery, useSubscription } from 'urql';
import { DOWNLOAD_CHANGED_SUBSCRIPTION, DOWNLOAD_STATUS_DOC } from './queries';

export type DownloaderState = 'STARTED' | 'STOPPED';

export type QueuedDownload = {
  chapterId: number;
  mangaId: number;
  mangaTitle: string;
  chapterName: string;
  chapterNumber: number;
  position: number;
  progress: number;
  state: string;
  tries: number;
};

export type DownloadStatus = {
  state: DownloaderState;
  queue: QueuedDownload[];
};

const EMPTY: DownloadStatus = { state: 'STOPPED', queue: [] };

/**
 * Single source of truth for the live download queue. Subscribes once via
 * `downloadChanged` (the older, broadly-supported subscription) and falls back
 * to the `downloadStatus` query while the subscription is initialising.
 */
export function useDownloadStatus(): DownloadStatus {
  const [{ data: snap }] = useQuery({ query: DOWNLOAD_STATUS_DOC, requestPolicy: 'cache-and-network' });
  const [{ data: live }] = useSubscription({ query: DOWNLOAD_CHANGED_SUBSCRIPTION });

  return useMemo(() => {
    const source = live?.downloadChanged ?? snap?.downloadStatus;
    if (!source) return EMPTY;
    const queue: QueuedDownload[] = source.queue.map((d) => ({
      chapterId: d.chapter.id,
      mangaId: d.chapter.mangaId,
      mangaTitle: d.manga.title,
      chapterName: d.chapter.name,
      chapterNumber: d.chapter.chapterNumber,
      position: d.position,
      progress: d.progress,
      state: d.state,
      tries: d.tries,
    }));
    queue.sort((a, b) => a.position - b.position);
    return { state: source.state as DownloaderState, queue };
  }, [snap, live]);
}

/**
 * Lookup of `chapterId → queued info` for cheap per-row state in chapter lists.
 */
export function useDownloadsByChapter(): Map<number, QueuedDownload> {
  const status = useDownloadStatus();
  return useMemo(() => {
    const m = new Map<number, QueuedDownload>();
    for (const d of status.queue) m.set(d.chapterId, d);
    return m;
  }, [status]);
}
