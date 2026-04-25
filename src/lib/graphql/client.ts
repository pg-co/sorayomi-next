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

export function makeUrqlClient() {
  const wsClient = createWsClient({
    url: wsUrl,
    connectionParams: () => {
      const { basicAuth } = readServerConfig();
      if (!basicAuth?.username) return {};
      return { authorization: `Basic ${btoa(`${basicAuth.username}:${basicAuth.password ?? ''}`)}` };
    },
    lazy: true,
    retryAttempts: Infinity,
    shouldRetry: () => true,
  });

  return createClient({
    url: resolveUrl(HTTP_PATH),
    fetchOptions: () => ({ headers: { ...authHeader() } }),
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
