---
name: Goal scorer must belong to the scoring team
description: Invariant + enforcement for who can be credited with a goal in a match.
---

A goal's `teamId` is always the **scorer's own team** — including own goals.
For an own goal the score attribution flips to the opponent, but `teamId`
stays the conceding (scorer's) team. So validating `scorerName` against
`teamId`'s squad is correct for normal goals *and* own goals.

**Rule:** the scorer must be a registered player of `teamId`, and `teamId`
must be one of the match's two teams. Enforced server-side in the add-goal
route and in the admin Match detail UI (player dropdown per team).

**Why:** scorers used to be free text, letting an admin credit a goal to any
name — even an opposing-team player. The dropdown + server guard close that.

**How to apply:**
- Teams **without** a registered squad fall back to free text (UI shows a text
  input; backend skips the squad check) so goal entry never breaks for an
  unsquadded team. Keep both sides of this fallback in sync.
- Goals store only `scorerName` (text), so duplicate player names within one
  squad are ambiguous. If exact scorer identity ever matters, add a `playerId`
  column/field rather than matching by name — but keep `teamId` = scorer's team.
