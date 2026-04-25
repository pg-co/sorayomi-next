import { cn } from '@/lib/utils';
import type { FitMode } from '../reader-settings-store';

export function SingleMode({
  pages,
  page,
  fit,
  pixelated,
  onTapZone,
}: {
  pages: string[];
  page: number;
  fit: FitMode;
  pixelated: boolean;
  onTapZone: (zone: 'prev' | 'next' | 'center') => void;
}) {
  const url = pages[page];
  return (
    <div
      className={cn(
        'relative grid h-full w-full place-items-center overflow-auto',
        pixelated && 'reader-pixelated',
      )}
    >
      {url ? (
        <img
          src={url}
          alt={`Page ${page + 1}`}
          decoding="async"
          className={cn(
            'select-none',
            fit === 'width' && 'h-auto w-full max-w-none',
            fit === 'height' && 'h-full max-h-screen w-auto',
            fit === 'original' && 'h-auto w-auto max-w-none',
          )}
          draggable={false}
        />
      ) : null}
      <TapZones onTapZone={onTapZone} />
    </div>
  );
}

export function TapZones({ onTapZone }: { onTapZone: (zone: 'prev' | 'next' | 'center') => void }) {
  return (
    <div className="absolute inset-0 grid grid-cols-3" aria-hidden>
      <button
        type="button"
        className="cursor-w-resize"
        aria-label="Previous page"
        onClick={() => onTapZone('prev')}
      />
      <button
        type="button"
        className="cursor-pointer"
        aria-label="Toggle controls"
        onClick={() => onTapZone('center')}
      />
      <button
        type="button"
        className="cursor-e-resize"
        aria-label="Next page"
        onClick={() => onTapZone('next')}
      />
    </div>
  );
}
