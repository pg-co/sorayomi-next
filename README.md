# sorayomi-next

A modern web UI for [Suwayomi-Server](https://github.com/Suwayomi/Suwayomi-Server) — a refresh of [Suwayomi-VUI](https://github.com/Suwayomi/Suwayomi-VUI) on a React + Vite stack.

## Stack

- **Vite + React 19 + TypeScript** — pure SPA, single static bundle.
- **TanStack Router** — file-based, type-safe routing.
- **urql + graphql-codegen** — typed GraphQL client with normalized cache and `graphql-ws` subscriptions.
- **TanStack Query + ky** — REST fallback (page images, backups).
- **Tailwind v4 + shadcn/ui** — custom theme, dark-first.

## Getting started

```bash
# Install
pnpm install

# Run a Suwayomi-Server somewhere (defaults to http://localhost:4567)
# Optional: VITE_SUWAYOMI_URL=http://my-server:4567

# Start the dev server (proxies /api to the Suwayomi server)
pnpm dev
```

The app boots at <http://localhost:5173>. If you'd rather configure the server URL at runtime instead of via env, leave `VITE_SUWAYOMI_URL` unset and set the URL in **Settings → Server** inside the app.

## Scripts

| Command            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `pnpm dev`         | Vite dev server with router + Tailwind plugins |
| `pnpm build`       | Type-check, then build the static bundle       |
| `pnpm preview`     | Preview the built bundle                       |
| `pnpm typecheck`   | TypeScript build-mode type-check only          |
| `pnpm codegen`     | Regenerate GraphQL typed operations            |

## Project layout

```
src/
├── components/
│   ├── app-shell/       # SideRail, TopBar, BottomNav, CommandPalette
│   └── ui/              # shadcn primitives (added on demand)
├── features/            # Library, Browse, Manga, Reader, Downloads, Settings, …
├── lib/
│   ├── graphql/         # urql client + codegen output
│   ├── rest/            # ky client + URL builders
│   ├── auth.ts          # (planned) auth helpers beyond basic auth
│   ├── server-config.ts # Server URL + basic auth persistence
│   └── utils.ts         # cn() helper
├── routes/              # TanStack Router file-based routes
├── styles/globals.css   # Tailwind v4 + theme tokens
└── main.tsx
```
