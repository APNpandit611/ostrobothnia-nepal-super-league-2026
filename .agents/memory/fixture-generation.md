---
name: Fixture generation
description: How round-robin fixtures are generated and why the team roster must never be hardcoded.
---

# Fixture generation (`POST /api/matches/generate`)

The schedule must be derived from the teams that actually exist in the DB at
generation time, using a generic single round-robin (circle method). It must
work for any team count >= 2 and any names/short names.

**Why:** The roster is not fixed. The original generator hardcoded a 5-team
lineup and looked up IDs by short name (`KSB/JNK/ONS/SIS/VNR`) with `!`
non-null assertions. When the DB no longer had those exact short names, the
lookups returned `undefined`; Drizzle then omitted the NOT NULL FK columns and
Postgres rejected the insert → HTTP 500 (looked like a data-type bug, wasn't).

**How to apply:**
- Never reference specific team names/short names in the generator. Pull
  `teams` from the DB and build pairings from their IDs.
- Odd team counts are padded with a `BYE` sentinel that is skipped before
  insert (never written to the DB).
- Delete-old + insert-new is wrapped in a single `db.transaction` so a failed
  regeneration rolls back instead of leaving the tournament with no fixtures.
- Each round = one time slot (from 10:15, 37-min gaps); pitch increments within
  a round. For >5 teams a round can produce pitch 3+ (venue is designed for 2
  pitches / 5 teams) — revisit if a real >5-team event is run.
