---
name: Team approval visibility gate
description: How public visibility of registered teams is gated by squadStatus, and why /api/teams stays unfiltered.
---

# Team approval visibility gate

Registered teams are hidden from the public until an admin approves their squad. The single gate is `squadStatus`:
`null` = no squad submitted, `"pending"` = submitted/awaiting approval, `"approved"` = publicly visible.

**Rules (keep consistent):**
- Team registration (`POST /register/team`) must set `squadStatus: "pending"` — a registration always submits a full squad, so it belongs in the admin approval queue, not `null`. Leaving it `null` makes the team invisible to the admin "pending" banner (which filters `=== "pending"`) yet visible publicly — the original bug.
- Public surfaces show ONLY approved teams: public teams list page, `GET /teams/:id` (returns 404 for non-approved → squad poster page shows "not found"), `/standings`, `/stats` + `/stats/top-scorers`. The home page derives its team list from `/standings`, so it is gated automatically.
- `GET /api/teams` (list) intentionally returns ALL statuses. The admin UI (`admin/teams.tsx`, dashboard) uses the same `useListTeams` hook and needs pending/null teams to manage and approve them. **Do not** server-filter the list endpoint to approved-only or you break admin.

**Why:** the requirement was "registered teams must not appear on public pages until an admin approves." The gate lives on the public read paths, while the admin list stays unfiltered.

**Known pre-existing gaps (NOT part of this gate, separate security pass):** the `Team` schema exposes `managerEmail`/`managerPhone` on public endpoints for all teams; `GET /api/matches` filters by "has players" not approval. Neither is triggered by the registration flow (a new team has no matches), so they were left alone here.
