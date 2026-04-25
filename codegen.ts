import type { CodegenConfig } from '@graphql-codegen/cli';

/*
 * Schema source:
 *   - default: vendored ./schema.graphql (offline, deterministic)
 *   - set CODEGEN_LIVE=1 to introspect a running Suwayomi-Server instead.
 *     Useful when the vendored schema is ahead of your server version.
 *     Override the URL with SUWAYOMI_URL (defaults to http://localhost:4567).
 */
const live = process.env.CODEGEN_LIVE === '1';
const liveUrl = (process.env.SUWAYOMI_URL ?? 'http://localhost:4567').replace(/\/+$/, '');

const config: CodegenConfig = {
  schema: live ? `${liveUrl}/api/graphql` : 'schema.graphql',
  documents: ['src/**/*.{ts,tsx}'],
  generates: {
    'src/lib/graphql/__generated__/': {
      preset: 'client',
      plugins: [],
      config: {
        useTypeImports: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
