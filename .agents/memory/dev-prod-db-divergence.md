---
name: Dev vs prod database divergence
description: Why the workspace preview can show different/"missing" teams than the live site, and how to reconcile.
---

# Dev preview DB and production DB are separate and diverge

The workspace preview uses the **development** Postgres DB; the published site uses a
separate **production** DB. They are NOT mirrors and have drifted apart historically
(different team IDs, different teams). Teams **self-register through the live app**, so
the real tournament data (5 teams + players + matches) accumulates in **production**,
while the dev DB tends to hold only leftover test data.

**Why:** A session found dev had only 2 placeholder teams while users expected 5. The
5 real teams (KSB, JNK, VASA, OULU, SJK) with players + 10 matches were intact in
production all along — nothing was lost. The panic was purely a dev/prod mismatch.

**How to apply:**
- Before assuming data was deleted, check production first:
  `executeSql({ sqlQuery: "...", environment: "production" })` (READ-ONLY replica).
- To make the preview match live, copy prod → dev: pull each table with
  `SELECT json_agg(row_to_json(x)) FROM (SELECT * FROM <t> ORDER BY id) x`, unwrap the
  CSV-quoted JSON, then DELETE dev rows (FK order: goals, cards, match_events, matches,
  players, teams) and re-INSERT preserving IDs, then `setval(pg_get_serial_sequence(...))`.
- `pg` is NOT importable from the code_execution sandbox root — use `executeSql`
  (per-row parameterized INSERTs handle the large base64 `teams.logo_url` cleanly).
- `/api/matches` hides any match where a team has 0 registered players, so a dev DB
  missing players will also appear to be "missing matches" until players exist.
