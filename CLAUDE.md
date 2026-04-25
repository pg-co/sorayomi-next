# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**sorayomi-next** is a greenfield modern web UI for [Suwayomi-Server](https://github.com/Suwayomi/Suwayomi-Server) — a React/Vite refresh of [Suwayomi-VUI](https://github.com/Suwayomi/Suwayomi-VUI). Scope for v1 is **feature-parity port** of Suwayomi-VUI; the reader and library polish are the planned differentiators. As of 2026-04-25 only the scaffold (theme, app shell, router, clients, placeholder pages, server-config persistence) has landed — feature work is pending.

## Commands

Package manager is **pnpm**.

| Command           | Notes                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| `pnpm dev`        | Vite dev server on :5173, proxies `/api` to `VITE_SUWAYOMI_URL`.            |
| `pnpm build`      | Runs `prebuild` (codegen + routes), then `tsc -b` + `vite build`.           |
| `pnpm typecheck`  | Runs `prebuild` first — never `tsc` directly, generated files must exist.   |
| `pnpm lint`       | `eslint .`                                                                  |
| `pnpm codegen`    | GraphQL codegen → `src/lib/graphql/__generated__/`. Use `:watch` while iterating. |
| `pnpm routes`     | Regenerates `src/routeTree.gen.ts` from `src/routes/`.                      |

The TanStack Router Vite plugin auto-regenerates the route tree during `pnpm dev`, so `pnpm routes` is mainly for CI / one-shot type-checks.

### Codegen schema source

`codegen.ts` reads from the vendored `schema.graphql` by default. Set `CODEGEN_LIVE=1` (and optionally `SUWAYOMI_URL=http://host:port`) to introspect a running server when the vendor file is stale.

## Architecture

### Two client transports, one server config

The app talks to Suwayomi-Server through two clients that **share the same persisted config**:

- **GraphQL (primary)** — urql with `@urql/exchange-graphcache` + `graphql-ws` subscriptions, in `src/lib/graphql/client.ts`. Endpoint `/api/graphql` over HTTP and WS.
- **REST (fallback)** — `ky` instance in `src/lib/rest/client.ts`, used only for things GraphQL doesn't cover well: page images, manga thumbnails, backup upload/download.

Both clients resolve URLs and auth headers through `src/lib/server-config.ts` (`resolveUrl`, `authHeader`). That module reads/writes `localStorage['sorayomi:server-config']` and dispatches a `sorayomi:server-config-changed` event when the user changes it via Settings → Server. The base URL can be empty (use Vite dev proxy / same-origin reverse proxy in prod) or absolute (cross-origin to a remote Suwayomi-Server). Basic auth is optional and lives in the same blob.

Practical consequence: when adding a feature, prefer GraphQL; only reach for `rest` for page-image URLs (`chapterPageUrl`, `mangaThumbnailUrl`) or things outside the GraphQL schema. New REST helpers belong in `src/lib/rest/`.

### Generated artifacts — do not edit

- `src/routeTree.gen.ts` — TanStack Router file-based route tree. Edit `src/routes/**` and regenerate.
- `src/lib/graphql/__generated__/**` — graphql-codegen client-preset output. Write your `graphql(...)` documents in feature code, then run `pnpm codegen` (or `codegen:watch`).

`pnpm typecheck` and `pnpm build` invoke `prebuild` so they always see fresh generated files. Don't bypass it with a bare `tsc`.

### Routing & app shell

- Routes are file-based under `src/routes/` (root in `__root.tsx`); features under `src/features/<area>/` are imported by routes. Keep route files thin — data + composition — and put presentational pieces under `src/features/`.
- Router context exposes `{ urql, queryClient }` (see `src/main.tsx` and `__root.tsx`); use `useRouteContext()` to access them in loaders or components.
- The shell (`src/components/app-shell/`) provides SideRail (md+), BottomNav (mobile), TopBar, and a CommandPalette. New top-level destinations need an entry in `nav-items.ts`.

### Styling

- Tailwind **v4** via `@tailwindcss/vite`; theme tokens (dark-first peach/coral on warm-neutral surfaces) are CSS variables in `src/styles/globals.css`. There is no `tailwind.config.js`.
- shadcn/ui is configured for the **New York** style with `@/components/ui` as the install target (the dir is created on first `npx shadcn add`). `cn()` helper lives at `src/lib/utils.ts`. Icons: `lucide-react`. Toasts: `sonner` (provider already mounted in `__root.tsx`).
- Path alias: `@` → `src`.

### Dev server proxy

`vite.config.ts` proxies `/api` (HTTP + WS) to `VITE_SUWAYOMI_URL` (default `http://localhost:4567`). For local dev against a default Suwayomi install, no env var is needed; just `pnpm dev`.
