# Tournament App — Full Blueprint

A complete reference for replicating this full-stack football tournament management app from scratch.

---

## What Was Built

A production-ready web app for a one-day 5-team round-robin football tournament with:

- **Public site** — Home, Fixtures, Live Scores, Standings, Results, Teams, Stats
- **Admin panel** — Login, match control (start/finish/reset), live goal & card entry, team editor, fixture generator, tournament reset
- **Real-time** — 5-second polling keeps every public page fresh without WebSockets
- **Mobile-first** — fully responsive; designed to be operated from a phone on match day

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 (strict) |
| Monorepo | pnpm workspaces |
| Frontend | React 19 + Vite 7 |
| Routing | Wouter |
| Data fetching | TanStack React Query |
| UI components | shadcn/ui + Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| QR codes | qrcode.react |
| Backend | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API contract | OpenAPI 3.1 (orval codegen) |
| Logging | Pino + pino-http |
| Auth | Signed cookies (cookie-parser) |
| Build | esbuild (API server CJS bundle) |
| Deployment | Replit Autoscale |

---

## Monorepo Structure

```
workspace/
├── artifacts/
│   ├── nepal-league/          # React + Vite frontend  (port from $PORT)
│   └── api-server/            # Express API server     (port 8080, path /api)
├── lib/
│   ├── api-spec/              # openapi.yaml  ← single source of truth
│   │   └── orval.config.ts    # codegen config
│   ├── api-zod/               # generated Zod schemas & param types
│   ├── api-client-react/      # generated TanStack Query hooks
│   └── db/                    # Drizzle schema + db client
├── scripts/                   # utility scripts
├── pnpm-workspace.yaml        # catalog pins
├── tsconfig.base.json         # shared strict TS defaults
└── tsconfig.json              # solution file (libs only)
```

---

## Database Schema (PostgreSQL via Drizzle ORM)

### `teams`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | text | full name |
| short_name | text | e.g. KSB |
| primary_color | text | hex, default #16a34a |
| logo_url | text | nullable |
| created_at | timestamp | auto |

### `matches`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| match_number | integer | display order |
| home_team_id | integer FK → teams | |
| away_team_id | integer FK → teams | |
| home_score | integer | default 0 |
| away_score | integer | default 0 |
| scheduled_time | text | ISO datetime string |
| pitch | integer | 1 or 2 |
| status | text | upcoming / live / finished |
| started_at | timestamp | nullable |
| finished_at | timestamp | nullable |
| created_at | timestamp | auto |

### `goals`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| match_id | integer FK → matches CASCADE | |
| team_id | integer FK → teams | |
| scorer_name | text | nullable |
| assist_name | text | nullable |
| minute | integer | |
| is_own_goal | boolean | default false |
| created_at | timestamp | auto |

### `cards`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| match_id | integer FK → matches CASCADE | |
| team_id | integer FK → teams | |
| player_name | text | nullable |
| card_type | text | yellow / red |
| minute | integer | |
| created_at | timestamp | auto |

### `match_events`
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| match_id | integer FK → matches CASCADE | |
| team_id | integer FK → teams nullable | |
| event_type | text | goal / own_goal / yellow_card / red_card / substitution / etc. |
| minute | integer | |
| description | text | nullable |
| player_name | text | nullable |
| created_at | timestamp | auto |

> **Key rule:** Goals and cards each have their own table AND a corresponding match_event row. Deleting a goal triggers a full score recalculation by re-counting all remaining goals for that match.

---

## API Routes (`/api/*`)

### Auth
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Set signed cookie `nepal_admin_session` |
| POST | /api/auth/logout | Clear the cookie |
| GET | /api/auth/me | Returns `{ authenticated: true }` if cookie valid |

**Credentials:** username `admin` / password `admin123` (hardcoded)  
**Cookie name:** `nepal_admin_session`

### Teams
| Method | Path | Description |
|---|---|---|
| GET | /api/teams | List all teams |
| POST | /api/teams | Create team |
| PUT | /api/teams/:id | Update team |
| DELETE | /api/teams/:id | Delete team |

### Matches
| Method | Path | Description |
|---|---|---|
| GET | /api/matches | List all (filter: `?status=upcoming\|live\|finished`) |
| POST | /api/matches | Create single match |
| GET | /api/matches/:id | Get match detail with goals, cards, events |
| PUT | /api/matches/:id | Update match |
| DELETE | /api/matches/:id | Delete match |
| POST | /api/matches/generate | Wipe + regenerate all fixtures |
| POST | /api/matches/:id/start | Set status → live, record startedAt |
| POST | /api/matches/:id/finish | Set status → finished, record finishedAt |
| POST | /api/matches/:id/reset | Set status → upcoming, clear scores & events |

### Goals
| Method | Path | Description |
|---|---|---|
| GET | /api/goals?matchId= | List goals for a match |
| POST | /api/goals | Add goal → recalculate match score |
| DELETE | /api/goals/:id | Remove goal → recalculate match score |

### Cards
| Method | Path | Description |
|---|---|---|
| GET | /api/cards?matchId= | List cards for a match |
| POST | /api/cards | Add card |
| DELETE | /api/cards/:id | Remove card |

### Match Events
| Method | Path | Description |
|---|---|---|
| GET | /api/match-events?matchId= | List events for a match |
| POST | /api/match-events | Add event |
| DELETE | /api/match-events/:id | Remove event |

### Standings
| Method | Path | Description |
|---|---|---|
| GET | /api/standings | Live-computed league table from finished matches |

Computed columns per team: P, W, D, L, GF, GA, GD, Pts  
Sort order: Pts → GD → GF

### Stats
| Method | Path | Description |
|---|---|---|
| GET | /api/stats | Tournament stats: top scorers, most wins, best defense, highest scoring match, total goals, total cards |

### Tournament
| Method | Path | Description |
|---|---|---|
| POST | /api/tournament/reset | Wipe all goals, cards, events; reset all matches to upcoming with 0-0 |

### Health
| Method | Path | Description |
|---|---|---|
| GET | /api/healthz | `{ status: "ok" }` |

---

## Frontend Pages

| Route | File | Description |
|---|---|---|
| `/` | `pages/home.tsx` | Hero, tournament info, countdown, stats, QR code |
| `/fixtures` | `pages/fixtures.tsx` | All 10 matches, filter tabs (All/Upcoming/Live/Finished) |
| `/live` | `pages/live.tsx` | Live matches only, auto-polls every 5s |
| `/standings` | `pages/standings.tsx` | League table |
| `/results` | `pages/results.tsx` | Finished matches with scorers |
| `/teams` | `pages/teams.tsx` | Team cards with stats |
| `/stats` | `pages/stats.tsx` | Top scorers, best defense, most wins, etc. |
| `/admin` | `pages/admin/login.tsx` | Login form |
| `/admin/dashboard` | `pages/admin/dashboard.tsx` | Match list, generate fixtures, reset tournament |
| `/admin/matches/:id` | `pages/admin/match.tsx` | Live match control: start/finish/reset, add goals & cards |
| `/admin/teams` | `pages/admin/teams.tsx` | Edit team names and colors |

---

## Authentication Flow

1. `POST /api/auth/login` with `{ username, password }` in JSON body
2. Server validates against hardcoded credentials
3. On success: sets a **signed cookie** `nepal_admin_session=nepal-league-admin-2026`
4. All admin routes check the cookie via `req.cookies['nepal_admin_session']`
5. `GET /api/auth/me` used by the React `AuthGuard` component to protect `/admin/*` routes
6. `POST /api/auth/logout` clears the cookie

---

## Fixture Generator Logic

The `/api/matches/generate` endpoint:
1. Deletes all existing match_events, goals, cards, matches
2. Looks up teams by `short_name` to get stable IDs
3. Inserts a hardcoded schedule (10 matches across 2 pitches)
4. Returns the enriched match list with team names

**For this tournament (ONSL 2026):**
```
10:15  Pitch 1: KSB vs JNK    Pitch 2: ONS vs SIS
10:52  Pitch 1: KSB vs ONS    Pitch 2: VNR vs JNK
11:29  Pitch 1: KSB vs VNR    Pitch 2: JNK vs SIS
12:06  Pitch 1: KSB vs SIS    Pitch 2: ONS vs VNR
── Lunch break 12:33–13:15 ──
13:15  Pitch 1: JNK vs ONS    Pitch 2: SIS vs VNR
```

---

## Real-time Strategy

No WebSockets. Every public page uses `refetchInterval: 5000` in TanStack Query hooks.  
This is sufficient for a one-day tournament and requires zero extra infrastructure.

```ts
const { data } = useListMatches({ status: 'live' }, {
  refetchInterval: 5000,
});
```

---

## Score Calculation

Scores are **not stored** in the goals table and **not manually set** (except via the admin score editor). They are always derived by counting goals:

```ts
// On every goal INSERT or DELETE:
const homeGoals = await db.select().from(goalsTable)
  .where(and(eq(goalsTable.matchId, matchId), eq(goalsTable.teamId, homeTeamId)));
const awayGoals = await db.select().from(goalsTable)
  .where(and(eq(goalsTable.matchId, matchId), eq(goalsTable.teamId, awayTeamId)));

await db.update(matchesTable).set({
  homeScore: homeGoals.length,
  awayScore: awayGoals.length,
}).where(eq(matchesTable.id, matchId));
```

Own goals count for the **opposing team**.

---

## Standings Calculation

Standings are computed on every request from `finished` matches — no separate standings table.

```ts
for (const match of finishedMatches) {
  // home team
  row.played++; row.goalsFor += match.homeScore; row.goalsAgainst += match.awayScore;
  if (match.homeScore > match.awayScore) { row.won++; row.points += 3; }
  else if (match.homeScore === match.awayScore) { row.drawn++; row.points += 1; }
  else { row.lost++; }
  // mirror for away team
}
// Sort: points → goalDifference → goalsFor
```

---

## Codegen Workflow

```
lib/api-spec/openapi.yaml
       ↓  pnpm --filter @workspace/api-spec run codegen (Orval)
lib/api-zod/src/generated/        ← Zod schemas, param types
lib/api-client-react/src/generated/  ← TanStack Query hooks
```

After any API change:
1. Edit `openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Server imports from `@workspace/api-zod` for validation
4. Frontend imports hooks from `@workspace/api-client-react`

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | `@workspace/db` | Postgres connection string |
| `SESSION_SECRET` | API server | Signs/verifies session cookies |
| `PORT` | Both services | Assigned by Replit per artifact |

---

## Key Files to Customise When Replicating

| File | What to change |
|---|---|
| `lib/db/src/schema/teams.ts` | Team fields |
| `artifacts/api-server/src/routes/matches.ts` (generate endpoint) | Schedule, date, teams |
| `artifacts/nepal-league/src/pages/home.tsx` | Tournament name, venue, date, logo, APP_URL for QR |
| `artifacts/nepal-league/src/components/layout.tsx` | Sidebar logo and app name |
| `artifacts/nepal-league/index.html` | `<title>` and meta tags |
| `artifacts/api-server/src/routes/auth.ts` | Admin credentials |
| `artifacts/nepal-league/public/onsl-logo.jpeg` | Tournament logo |

---

## Replicating Step-by-Step

1. **Fork/copy the repo** — keep the full monorepo structure
2. **Create a new Postgres DB** — Replit provides one automatically
3. **Set env vars** — `DATABASE_URL`, `SESSION_SECRET`
4. **Update team data** — edit the DB seed and `matches.ts` schedule
5. **Swap the logo** — drop your logo into `artifacts/nepal-league/public/`
6. **Update branding** — `home.tsx`, `layout.tsx`, `index.html`
7. **Push DB schema** — `pnpm --filter @workspace/db run push`
8. **Generate fixtures** — `POST /api/matches/generate`
9. **Deploy** — click Publish in Replit

---

## Deployed App

- **Live URL:** https://nepal-su-app--samikshyakc163.replit.app
- **Admin login:** `admin` / `admin123`
- **Deployment type:** Replit Autoscale
