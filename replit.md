# Nepal Summer League Finland 2026

A full-stack football tournament management app for the Nepal Summer League Finland 2026 — a one-day 5-team round-robin tournament with live scores, standings, real-time match events, and a mobile-friendly admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — admin session signing, `ADMIN_PASSWORD` — admin login password (`ADMIN_USERNAME` optional, defaults to `admin`)
- Email env (SMTP): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` (secret), and `MAIL_FROM`. Currently set to the club's Spacemail mailbox (`mail.spacemail.com:465`, `info@kokkolasoccerboys.cc`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + framer-motion + wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle DB schema (teams, matches, goals, cards, match_events)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/nepal-league/src/` — React frontend
- `artifacts/nepal-league/src/pages/` — All pages (home, fixtures, live, standings, results, teams, stats, admin)

## Architecture decisions

- Admin sessions use an HMAC-signed cookie (`nepal_admin_session`) signed with `SESSION_SECRET` — no JWT, no external auth service. All `/admin/*` API routes (including reads) require a valid session
- Standings computed on-the-fly from finished matches (no denormalized standings table)
- Goals update match scores directly via DB; deleting a goal recalculates score from scratch
- Round-robin fixtures auto-generated via POST /api/matches/generate (clears old fixtures)
- Live updates via 5-second polling on the frontend (no WebSocket needed for one-day tournament)
- Every admin (and public) operation reads/writes the database directly via Drizzle — no server-side caching layer, so data is always authoritative
- Performance for ~1000 concurrent users comes from explicit DB indexes on the FK/filter columns (Postgres does NOT auto-index FK referencing columns) plus a tuned pg connection pool — not from caching. Indexes live in `lib/db/src/schema/*` via Drizzle `.index()`
- Connection pool size is `DB_POOL_MAX` (default 20) in `lib/db/src/index.ts`. Constraint: keep `instances × DB_POOL_MAX` below the DB's `max_connections` (currently 112) so autoscale can't exhaust connections

## Product

- **Public**: View fixtures, live scores, standings, results, team info, statistics
- **Admin panel** (`/admin`): Login with username `admin` and the password stored in the `ADMIN_PASSWORD` secret; manage matches (start/finish/reset), add goals & cards in real time, edit teams, generate fixtures, reset tournament

## Teams

1. Kokkola Soccer Boys (KSB) — green
2. Jeppis Nepal Klub (JNK) — blue
3. Oulu Nepalese Sports (ONS) — red
4. Seinajoki International Society (SIS) — purple
5. Vaasan Nepali Ry (VNR) — orange

## User preferences

_Populate as needed._

## Gotchas

- After adding new schema files, run `pnpm run typecheck:libs` before typechecking leaf packages — stale declarations cause TS2305 errors
- The `goals` route recalculates match score on every delete (counts all remaining goals)
- Admin credentials come from the environment: `ADMIN_USERNAME` (defaults to `admin`) and `ADMIN_PASSWORD` (required secret). Login returns 503 if `ADMIN_PASSWORD` is unset
- Email is sent via **authenticated SMTP** (`nodemailer`) using the club's **Spacemail** mailbox (`mail.spacemail.com`, port 465 implicit TLS, user `info@kokkolasoccerboys.cc`). Config lives in `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS`/`MAIL_FROM`. The single transport is built in `mailer.ts` and reused by `otp.ts`
- **Gmail SMTP does not work from this cloud environment** (outbound connections to Gmail's SMTP time out) — that's why the original setup failed. Spacemail's SMTP ports (465/587) ARE reachable. The earlier Resend HTTP API attempt was abandoned because Resend only sends from a verified domain (unverified → 403). If email stops sending, first check that `SMTP_PASS` matches the current `info@kokkolasoccerboys.cc` mailbox password
- The `from` address must be the authenticated mailbox (or an alias it can send as), or Spacemail rejects the message — keep `MAIL_FROM` aligned with `SMTP_USER`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
