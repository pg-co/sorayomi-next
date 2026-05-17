import ky from 'ky';
import { authHeader, resolveUrl } from '@/lib/server-config';

/**
 * REST client for the few Suwayomi endpoints not yet covered by GraphQL —
 * notably page images and backup file upload/download.
 */
export const rest = ky.create({
  prefixUrl: '',
  credentials: 'omit',
  hooks: {
    afterResponse: [
      (_req, _opts, res) => {
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent('sorayomi:auth-required'));
        }
        return res;
      },
    ],
    beforeRequest: [
      (req) => {
        const url = new URL(req.url);
        // ky strips relative prefixes; rewrite `/api/...` requests through the configured server URL.
        if (url.pathname.startsWith('/api/')) {
          const target = resolveUrl(url.pathname + url.search);
          if (target !== url.pathname + url.search) {
            return new Request(target, req);
          }
        }
        const auth = authHeader();
        if (auth.Authorization) req.headers.set('Authorization', auth.Authorization);
      },
    ],
  },
});

/** Build a URL for a chapter page image. */
export function chapterPageUrl(mangaId: number, chapterIndex: number, pageIndex: number): string {
  return resolveUrl(`/api/v1/manga/${mangaId}/chapter/${chapterIndex}/page/${pageIndex}`);
}

/** Build a URL for a manga thumbnail. */
export function mangaThumbnailUrl(mangaId: number): string {
  return resolveUrl(`/api/v1/manga/${mangaId}/thumbnail`);
}
