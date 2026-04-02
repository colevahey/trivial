# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js version

This project uses **Next.js 16**, which has breaking changes from what most training data covers. Read `node_modules/next/dist/docs/` before writing code that touches routing, rendering, or config. Heed deprecation notices.

## Commands

```bash
nvm use 25          # Node 25+; project requires >=20.9.0
npm run dev         # Start dev server at localhost:3000
npm run build       # Production build + TypeScript check
npm run start       # Serve production build
```

No test runner is configured.

## Environment

Create `.env.local` with a TMDB API key (free at themoviedb.org/settings/api):
```
TMDB_API_KEY=your_key_here
```

The key is only read server-side. It must never reach the client — all TMDB calls go through the `/api/*` proxy routes.

## Architecture

Three interlocking app modes built on a shared TMDB data layer:

**Career Mapper** (`/actor/[id]`) — Five visualization tabs for an actor's filmography: a Recharts scatter timeline (year × rating, bubble size = revenue), Recharts radar genre breakdown, Recharts composed box office chart, a D3 force-directed co-star network, and a paginated filmography grid.

**Six Degrees** (`/six-degrees`) — Two actor selectors, submits to `POST /api/six-degrees` which runs bidirectional BFS server-side, then renders an animated `PathVisualizer` chain.

**Trivia** (`/trivia/game`) — On load, the page picks two random actors from a hardcoded seed pool, verifies a 2–4 hop BFS path exists, then hands off to `TriviaGame`. The player manually traverses: picks a film the current actor appeared in, then picks a co-star, repeating until they reach the target. Score = `max(0, 1000 - (steps - optimalLength) * 100)`.

### Data flow

```
TMDB API (server-only, Bearer auth)
  → lib/tmdb.ts          typed fetch client, 1hr revalidation
  → lib/six-degrees.ts   bidirectional BFS, caches actor/movie lookups in Maps
  → app/api/* routes     thin proxies; only entry point for client code
  → hooks/use*.ts        SWR wrappers around the API routes
  → components/          React + D3 + Recharts
```

### Key files

| File | Role |
|---|---|
| `lib/types.ts` | All shared types (`Actor`, `Movie`, `Credit`, `PathNode`, `GameState`, etc.) |
| `lib/tmdb.ts` | TMDB client + its own raw types (`TMDBPersonDetail`, `TMDBCastMember`, etc.) |
| `lib/six-degrees.ts` | `findPath(fromId, toId): Promise<PathNode[]>` — bidirectional BFS, max depth 4 |
| `components/career/CoStarNetwork.tsx` | D3 force graph; re-runs simulation in `useEffect` when `coStars` changes; ResizeObserver for responsiveness |
| `app/trivia/game/page.tsx` | Seed pool of 20 actor IDs; pre-validates BFS path before handing to `TriviaGame` |

### Styling conventions

Dark cinematic theme throughout: `bg-zinc-950` page background, `bg-zinc-900` cards, `amber-400`/`amber-500` for all interactive/accent elements. Recharts charts use amber fills; D3 nodes use `#27272a` fill with amber ring on the center node.

### TMDB image URLs

All TMDB images use `TMDB_IMAGE_BASE` exported from `lib/tmdb.ts`:
```ts
`${TMDB_IMAGE_BASE}${profile_path}`  // → https://image.tmdb.org/t/p/w500/...
```
`next.config.ts` already allowlists `image.tmdb.org` for `<Image>`.
