import { useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { FitMode } from '../reader-settings-store';
import type { ReaderStreamPage } from '../use-pages';

export function ContinuousMode({
  pages,
  page,
  axis,
  fit,
  pixelated,
  pagePadding,
  onPageChange,
  onTapZone,
  onEndReached,
}: {
  pages: ReaderStreamPage[];
  page: number;
  axis: 'vertical' | 'horizontal';
  fit: FitMode;
  pixelated: boolean;
  pagePadding: number;
  onPageChange: (i: number) => void;
  onTapZone: (zone: 'prev' | 'next' | 'center') => void;
  onEndReached?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const externalScrollRef = useRef(false);
  const lastReportedPageRef = useRef(page);
  const scrollFrameRef = useRef<number | null>(null);
  const endFiredForLengthRef = useRef(0);
  const virtualizer = useVirtualizer({
    count: pages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => (axis === 'vertical' ? 960 : 720),
    horizontal: axis === 'horizontal',
    overscan: 2,
  });

  const reportVisiblePage = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const virtualItems = virtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;

    const viewportCenter =
      axis === 'vertical'
        ? container.scrollTop + container.clientHeight / 2
        : container.scrollLeft + container.clientWidth / 2;

    let bestIndex = virtualItems[0].index;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const item of virtualItems) {
      const center = item.start + item.size / 2;
      const distance = Math.abs(center - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = item.index;
      }
    }

    if (!externalScrollRef.current && bestIndex !== lastReportedPageRef.current) {
      lastReportedPageRef.current = bestIndex;
      onPageChange(bestIndex);
    }

    if (
      onEndReached &&
      virtualItems[virtualItems.length - 1]?.index >= pages.length - 1 &&
      endFiredForLengthRef.current !== pages.length
    ) {
      endFiredForLengthRef.current = pages.length;
      onEndReached();
    }
  }, [axis, onEndReached, onPageChange, pages.length, virtualizer]);

  // Scroll to the active page only when the parent moved it externally
  // (slider, keyboard) — not when the user is naturally scrolling.
  useEffect(() => {
    if (page === lastReportedPageRef.current) return;
    externalScrollRef.current = true;
    virtualizer.scrollToIndex(page, {
      align: 'start',
      behavior: 'smooth',
    });
    const t = window.setTimeout(() => {
      externalScrollRef.current = false;
      reportVisiblePage();
    }, 600);
    return () => window.clearTimeout(t);
  }, [page, reportVisiblePage, virtualizer]);

  // Reset end-reached guard when chapter (pages) changes.
  useEffect(() => {
    endFiredForLengthRef.current = 0;
    reportVisiblePage();
  }, [pages.length, reportVisiblePage]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current != null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      onScroll={() => {
        if (scrollFrameRef.current != null) {
          window.cancelAnimationFrame(scrollFrameRef.current);
        }
        scrollFrameRef.current = window.requestAnimationFrame(() => {
          scrollFrameRef.current = null;
          reportVisiblePage();
        });
      }}
      onClick={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        if (axis === 'vertical') {
          const r = (e.clientY - rect.top) / rect.height;
          onTapZone(r < 0.3 ? 'prev' : r > 0.7 ? 'next' : 'center');
        } else {
          const r = (e.clientX - rect.left) / rect.width;
          onTapZone(r < 0.3 ? 'prev' : r > 0.7 ? 'next' : 'center');
        }
      }}
      className={cn(
        'h-full w-full overflow-auto',
        axis === 'vertical' ? 'overflow-x-hidden' : 'overflow-y-hidden',
        pixelated && 'reader-pixelated',
      )}
    >
      <div
        style={
          axis === 'vertical'
            ? { height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }
            : { height: '100%', position: 'relative', width: virtualizer.getTotalSize() }
        }
      >
        {virtualizer.getVirtualItems().map((item) => {
          const pageItem = pages[item.index];
          if (!pageItem) return null;

          return (
            <div
              key={pageItem.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              style={
                axis === 'vertical'
                  ? {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: `translateY(${item.start}px)`,
                      width: '100%',
                      paddingBottom: item.index === pages.length - 1 ? 0 : pagePadding,
                    }
                  : {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: `translateX(${item.start}px)`,
                      height: '100%',
                      paddingRight: item.index === pages.length - 1 ? 0 : pagePadding,
                    }
              }
              className={cn(
                'grid place-items-center',
                axis === 'vertical' ? 'min-h-screen' : 'h-full',
              )}
            >
              <img
                src={pageItem.src}
                alt={`Page ${pageItem.chapterPageIndex + 1}`}
                decoding="async"
                draggable={false}
                onLoad={() => virtualizer.measure()}
                className={cn(
                  'block select-none',
                  axis === 'vertical' && fit === 'width' && 'h-auto w-full max-w-screen-md',
                  axis === 'vertical' && fit === 'height' && 'h-screen w-auto',
                  axis === 'vertical' && fit === 'original' && 'h-auto w-auto',
                  axis === 'horizontal' && fit === 'height' && 'h-full w-auto',
                  axis === 'horizontal' && fit === 'width' && 'h-auto w-screen',
                  axis === 'horizontal' && fit === 'original' && 'h-auto w-auto',
                )}
                loading={item.index < 3 ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}
      </div>
      <div
        ref={sentinelRef}
        aria-hidden
        className={cn(axis === 'vertical' ? 'h-px w-full' : 'h-full w-px')}
      />
    </div>
  );
}
