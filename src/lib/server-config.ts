const STORAGE_KEY = 'sorayomi:server-config';

export type ServerConfig = {
  /** Base URL of the Suwayomi server, e.g. http://localhost:4567. Empty string means "same-origin (proxy)". */
  url: string;
  /** Optional HTTP basic auth — Suwayomi-Server can require it. */
  basicAuth?: { username: string; password: string };
};

const DEFAULT_CONFIG: ServerConfig = { url: '' };

export function readServerConfig(): ServerConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<ServerConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function writeServerConfig(next: ServerConfig) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('sorayomi:server-config-changed'));
}

/** Resolves a path against the configured server URL, falling back to same-origin (Vite dev proxy / production reverse proxy). */
export function resolveUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const { url } = readServerConfig();
  if (!url) return pathOrUrl;
  return url.replace(/\/+$/, '') + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}

export function authHeader(): Record<string, string> {
  const { basicAuth } = readServerConfig();
  if (!basicAuth?.username) return {};
  const token = btoa(`${basicAuth.username}:${basicAuth.password ?? ''}`);
  return { Authorization: `Basic ${token}` };
}

export function shouldUseAuthenticatedAssetFetch(pathOrUrl: string): boolean {
  if (!pathOrUrl || /^(data|blob):/i.test(pathOrUrl)) return false;
  const { basicAuth, url } = readServerConfig();
  if (!basicAuth?.username) return false;
  if (!/^https?:\/\//i.test(pathOrUrl)) return true;
  if (typeof window === 'undefined') return false;

  const target = new URL(pathOrUrl, window.location.href);
  const base = url ? new URL(url, window.location.href) : new URL(window.location.origin);
  if (target.origin !== base.origin) return false;

  const basePath = base.pathname.replace(/\/+$/, '');
  if (!basePath || basePath === '/') return true;
  return target.pathname === basePath || target.pathname.startsWith(`${basePath}/`);
}
