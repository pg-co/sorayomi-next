import { forwardRef, useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { rest } from '@/lib/rest/client';
import { shouldUseAuthenticatedAssetFetch } from '@/lib/server-config';

type AuthImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
};

export const AuthImage = forwardRef<HTMLImageElement, AuthImageProps>(function AuthImage(
  { src, ...props },
  ref,
) {
  const resolvedSrc = useAuthenticatedImageSrc(src);
  return <img ref={ref} src={resolvedSrc} {...props} />;
});

export function useAuthenticatedImageSrc(src?: string | null) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(() =>
    src && !shouldUseAuthenticatedAssetFetch(src) ? src : undefined,
  );

  useEffect(() => {
    if (!src) {
      setResolvedSrc(undefined);
      return;
    }
    if (!shouldUseAuthenticatedAssetFetch(src)) {
      setResolvedSrc(src);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    setResolvedSrc(undefined);

    rest
      .get(src, { signal: controller.signal })
      .blob()
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setResolvedSrc(objectUrl);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setResolvedSrc(undefined);
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return resolvedSrc;
}

export function preloadAuthenticatedImages(urls: string[]) {
  for (const url of urls) {
    if (!shouldUseAuthenticatedAssetFetch(url)) {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      continue;
    }

    void rest
      .get(url)
      .blob()
      .then(() => undefined)
      .catch(() => undefined);
  }
}
