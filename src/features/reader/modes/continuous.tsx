import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { FitMode } from '../reader-settings-store';

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
  pages: string[];
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
  const itemRefs = useRef<(HTMLImageElement | null)[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const externalScrollRef = useRef(false);
  const lastReportedPageRef = useRef(page);
  const endFiredRef = useRef(false);

  // Scroll to the active page only when the parent moved it externally
  // (slider, keyboard) — not when the user is naturally scrolling.
  useEffect(() => {
    if (page === lastReportedPageRef.current) return;
    const el = itemRefs.current[page];
    if (!el) return;
    externalScrollRef.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    const t = window.setTimeout(() => {
      externalScrollRef.current = false;
    }, 600);
    return () => window.clearTimeout(t);
  }, [page]);

  // Detect which page is currently most visible and report back.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (externalScrollRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const idx = Number((visible[0].target as HTMLElement).dataset.index);
          if (Number.isFinite(idx)) {
            lastReportedPageRef.current = idx;
            onPageChange(idx);
          }
        }
      },
      { root, threshold: [0.4, 0.6, 0.8] },
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pages.length, onPageChange]);

  // Reset end-reached guard when chapter (pages) changes.
  useEffect(() => {
    endFiredRef.current = false;
  }, [pages]);

  // Sentinel at the end → fire onEndReached once when it scrolls into view.
  useEffect(() => {
    const root = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !onEndReached) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !endFiredRef.current) {
            endFiredRef.current = true;
            onEndReached();
          }
        }
      },
      { root, threshold: 0.5 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onEndReached, pages.length]);

  return (
    <div
      ref={containerRef}
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
        axis === 'vertical' ? 'flex flex-col items-center' : 'flex flex-row items-center',
        pixelated && 'reader-pixelated',
      )}
      style={{ gap: pagePadding }}
    >
      {pages.map((src, i) => (
        <img
          key={`${i}-${src}`}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          data-index={i}
          src={src}
          alt={`Page ${i + 1}`}
          decoding="async"
          draggable={false}
          className={cn(
            'block select-none',
            axis === 'vertical' && fit === 'width' && 'h-auto w-full max-w-screen-md',
            axis === 'vertical' && fit === 'height' && 'h-screen w-auto',
            axis === 'vertical' && fit === 'original' && 'h-auto w-auto',
            axis === 'horizontal' && fit === 'height' && 'h-full w-auto',
            axis === 'horizontal' && fit === 'width' && 'h-auto w-screen',
            axis === 'horizontal' && fit === 'original' && 'h-auto w-auto',
          )}
          loading={i < 3 ? 'eager' : 'lazy'}
        />
      ))}
      <div
        ref={sentinelRef}
        aria-hidden
        className={cn(axis === 'vertical' ? 'h-px w-full' : 'h-full w-px')}
      />
    </div>
  );
}
