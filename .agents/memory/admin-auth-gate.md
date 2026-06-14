---
name: Admin auth gate & session cookie
description: How admin endpoints are protected (central gate) and how the admin session cookie must be signed, not a literal.
---

# Admin auth gate & session cookie

## Central gate covers ALL `/admin/*`, including reads
The auth middleware in `artifacts/api-server/src/routes/index.ts` makes GET/HEAD/OPTIONS public by default, EXCEPT any path that is `/admin` or starts with `/admin/`, which always runs `requireAuth` (every method). `/auth/me` is intentionally public (not under `/admin`) so the frontend can probe admin status.

**Rule:** put admin-only data under an `/admin/*` path. Do NOT add a public (non-`/admin`) GET that returns admin/sensitive data, and do NOT carve admin paths out of the central gate.

**Why:** admin reads expose applicant PII (`/admin/club-applications` returns email/phone/dob) and unpublished content (`/admin/announcements`). Originally the gate only protected mutations, so all admin GETs were world-readable. Client-side `enabled: isAdmin` gating is NOT an authorization boundary.

## Session cookie must be HMAC-signed, never a literal
The admin session cookie (`nepal_admin_session`) value is an HMAC token signed with `SESSION_SECRET`, created/verified in `artifacts/api-server/src/lib/session.ts` (`createSessionToken` / `verifySessionToken`). requireAuth and `/auth/me` both verify via that helper.

**Rule:** never reintroduce a hardcoded/static cookie value. The earlier implementation accepted a fixed literal, so anyone reading the source could forge a session.

**Why:** this repo is intended to be pushed to public GitHub; a static cookie value in source is a trivially forgeable admin session.

## Remaining public-repo risk (not yet fixed)
Admin username/password are still hardcoded in `artifacts/api-server/src/routes/auth.ts` (and documented in replit.md). Signing closes cookie forgery, but a known password from public source still allows a normal login. Move credentials to env/secrets before going public — flag to the user rather than changing their login silently.
