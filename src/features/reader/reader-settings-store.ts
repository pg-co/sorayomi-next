import { useEffect, useState } from 'react';
import { useMutation } from 'urql';
import { SET_MANGA_META_DOC } from './queries';

export type ReaderMode = 'single' | 'double' | 'vertical' | 'horizontal';
export type FitMode = 'width' | 'height' | 'original';

export type ReaderSettings = {
  mode: ReaderMode;
  rtl: boolean;
  fit: FitMode;
  pixelated: boolean;
  pagePadding: number;
  bg: 'black' | 'gray' | 'white';
};

export const DEFAULT_SETTINGS: ReaderSettings = {
  mode: 'vertical',
  rtl: false,
  fit: 'width',
  pixelated: false,
  pagePadding: 0,
  bg: 'black',
};

const META_KEY = 'sorayomi.reader';

function parseMeta(value: string | undefined): Partial<ReaderSettings> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Partial<ReaderSettings>;
    return parsed;
  } catch {
    return {};
  }
}

export function readSettingsFromMeta(meta: ReadonlyArray<{ key: string; value: string }> | undefined): ReaderSettings {
  const entry = meta?.find((m) => m.key === META_KEY);
  return { ...DEFAULT_SETTINGS, ...parseMeta(entry?.value) };
}

export function useReaderSettings(
  mangaId: number | null,
  initial: ReaderSettings,
): [ReaderSettings, (patch: Partial<ReaderSettings>) => void] {
  const [settings, setSettings] = useState<ReaderSettings>(initial);
  const [, run] = useMutation(SET_MANGA_META_DOC);

  // Keep state in sync if the upstream settings change (e.g. server returns later).
  useEffect(() => {
    setSettings(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initial)]);

  function update(patch: Partial<ReaderSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (mangaId != null) {
      run({ mangaId, key: META_KEY, value: JSON.stringify(next) }).catch(() => {});
    }
  }

  return [settings, update];
}
