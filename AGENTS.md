# AGENTS.md — CineMatch-Mini

Simplified college viva project. Separate from the original product at `../CineMatch`
— never modify that directory from here.

## Commands (Mini root; Node 20+)

- `npm run dev:backend` (tsx watch, :3000) / `npm run dev:frontend` (Vite, :5173)
- Backend: `npm run typecheck|lint|build --workspace=backend`, `npm test --workspace=backend`
  (vitest, mongodb-memory-server, `dist/` excluded), `npm run db:seed --workspace=backend`
- Frontend: same with `--workspace=frontend` (lint uses `--max-warnings 0`)
- Installs need `--legacy-peer-deps` (TS5 backend vs TS6 frontend hoisting).
- Root has a `typescript@5` devDep so `typescript-eslint` resolves for backend lint.

## Env & services

- Backend `src/config/env.ts` requires `MONGODB_URI`, `JWT_ACCESS_SECRET`,
  `JWT_REFRESH_SECRET` (32+ chars). `cp backend/.env.example backend/.env` just works.
- DB name must stay `cinematch_mini`; seed is idempotent, never deletes.
  `npm run db:posters --workspace=backend` backfills only `posterPath` on the
  21 titled records (same safety guarantees).
- API under `/api/v1`; frontend keeps the original design — poster
  work uses the existing `posterPath` field + `posterUrl()` helper +
  shared `onPosterError` → `/poster-placeholder.svg`. Do not restyle cards;
  Mini backend keeps the same route/response shapes on purpose.
- NL search is rule-based (`parseNaturalQuery` in `search.routes.ts`,
  exported for tests) — never add AI/embeddings/vector search here.

## Conventions

- Backend ESM: relative imports use `.js` suffix. Errors: `AppError` + `errorHandler`
  + `catchAsync`; envelope `{success, data}` / `{success:false, error:{message, code}}`.
- Auth: JWT in HttpOnly cookies + sha256 refresh rotation; auth limiter refunds
  successes (`skipSuccessfulRequests`), default 30 dev / 5 prod.
- Movies live in ONE `movies` collection (`type: movie|tv`); presenter
  `toContent()` maps docs to the frontend `Content` shape.
