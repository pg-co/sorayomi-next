import { useMemo } from 'react';
import { useQuery, useSubscription } from 'urql';
import { UPDATE_STATUS_CHANGED_SUB, UPDATE_STATUS_DOC } from './queries';

export type LibraryUpdateStatus = {
  isRunning: boolean;
  complete: number;
  failed: number;
  pending: number;
  running: number;
  skipped: number;
  total: number;
  runningTitles: string[];
};

const EMPTY: LibraryUpdateStatus = {
  isRunning: false,
  complete: 0,
  failed: 0,
  pending: 0,
  running: 0,
  skipped: 0,
  total: 0,
  runningTitles: [],
};

type Snap = {
  isRunning: boolean;
  completeJobs: { mangas: { totalCount: number } };
  failedJobs: { mangas: { totalCount: number } };
  pendingJobs: { mangas: { totalCount: number } };
  runningJobs: { mangas: { totalCount: number; nodes?: ReadonlyArray<{ id: number; title: string }> } };
  skippedJobs: { mangas: { totalCount: number } };
};

function summarise(s: Snap | undefined): LibraryUpdateStatus {
  if (!s) return EMPTY;
  const complete = s.completeJobs.mangas.totalCount;
  const failed = s.failedJobs.mangas.totalCount;
  const pending = s.pendingJobs.mangas.totalCount;
  const running = s.runningJobs.mangas.totalCount;
  const skipped = s.skippedJobs.mangas.totalCount;
  return {
    isRunning: s.isRunning,
    complete,
    failed,
    pending,
    running,
    skipped,
    total: complete + failed + pending + running + skipped,
    runningTitles: s.runningJobs.mangas.nodes?.map((m) => m.title) ?? [],
  };
}

export function useLibraryUpdateStatus(): LibraryUpdateStatus {
  const [{ data: snap }] = useQuery({ query: UPDATE_STATUS_DOC, requestPolicy: 'cache-and-network' });
  const [{ data: live }] = useSubscription({ query: UPDATE_STATUS_CHANGED_SUB });

  return useMemo(() => summarise(live?.updateStatusChanged ?? snap?.updateStatus), [snap, live]);
}
