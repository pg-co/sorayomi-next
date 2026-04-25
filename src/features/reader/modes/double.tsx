import { cn } from '@/lib/utils';
import type { FitMode } from '../reader-settings-store';
import { TapZones } from './single';

export function DoubleMode({
  pages,
  page,
  fit,
  rtl,
  pixelated,
  onTapZone,
}: {
  pages: string[];
  page: number;
  fit: FitMode;
  rtl: boolean;
  pixelated: boolean;
  onTapZone: (zone: 'prev' | 'next' | 'center') => void;
}) {
  const left = rtl ? pages[page + 1] : pages[page];
  const right = rtl ? pages[page] : pages[page + 1];

  return (
    <div className={cn('relative grid h-full w-full grid-cols-2 place-items-center overflow-auto', pixelated && 'reader-pixelated')}>
      <div className="grid h-full w-full place-items-center">
        {left ? <Page src={left} fit={fit} index={rtl ? page + 1 : page} /> : null}
      </div>
      <div className="grid h-full w-full place-items-center">
        {right ? <Page src={right} fit={fit} index={rtl ? page : page + 1} /> : null}
      </div>
      <TapZones onTapZone={onTapZone} />
    </div>
  );
}

function Page({ src, fit, index }: { src: string; fit: FitMode; index: number }) {
  return (
    <img
      src={src}
      alt={`Page ${index + 1}`}
      decoding="async"
      draggable={false}
      className={cn(
        'select-none',
        fit === 'width' && 'h-auto w-full max-w-none',
        fit === 'height' && 'h-full max-h-screen w-auto',
        fit === 'original' && 'h-auto w-auto max-w-none',
      )}
    />
  );
}
