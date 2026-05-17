import { createClient, fetchExchange, subscriptionExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { createClient as createWsClient } from 'graphql-ws';
import { authHeader, readServerConfig, resolveUrl } from '@/lib/server-config';

const HTTP_PATH = '/api/graphql';
const WS_PATH = '/api/graphql';

function wsUrl(): string {
  const httpBase = resolveUrl(HTTP_PATH);
  if (/^https?:/i.test(httpBase)) {
    return httpBase.replace(/^http/i, 'ws');
  }
  if (typeof window === 'undefined') return `ws://localhost:5173${WS_PATH}`;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}${WS_PATH}`;
}

async function authedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('sorayomi:auth-required'));
  }
  return res;
}

export function makeUrqlClient() {
  const wsClient = createWsClient({
    url: wsUrl,
    connectionParams: () => {
      const { basicAuth } = readServerConfig();
      if (!basicAuth?.username) return {};
      return { authorization: `Basic ${btoa(`${basicAuth.username}:${basicAuth.password ?? ''}`)}` };
    },
    lazy: true,
    retryAttempts: 5,
    shouldRetry: (event) => {
      if (!(event instanceof CloseEvent)) return true;
      return ![4401, 4403, 1002, 1003, 1008].includes(event.code);
    },
  });

  return createClient({
    url: resolveUrl(HTTP_PATH),
    fetch: authedFetch,
    fetchOptions: () => ({
      credentials: 'omit',
      headers: { ...authHeader() },
    }),
    exchanges: [
      cacheExchange({
        keys: {
          // Suwayomi schema uses non-`id` primary keys in a few places; map them here as we add types.
        },
      }),
      fetchExchange,
      subscriptionExchange({
        forwardSubscription(request) {
          const input = { ...request, query: request.query ?? '' };
          return {
            subscribe(sink) {
              const dispose = wsClient.subscribe(input, sink);
              return { unsubscribe: dispose };
            },
          };
        },
      }),
    ],
  });
}
