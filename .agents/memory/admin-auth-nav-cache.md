---
name: Admin auth state in shared Layout
description: Cache rules that keep admin-gated UI consistent across login/logout in the React frontend.
---

The admin session is cookie-based (separate from Clerk) and exposed by a single admin-me query that returns `isAdmin` (401 when not an admin). The shared Layout shows admin-only navigation on every page based on it, and the same query also guards admin routes — so two observers must always agree.

**Durable rules for any admin-gated UI (break one and the nav goes stale):**
- Treat the query as admin ONLY when it is not errored — a previously-successful query can still expose old data during a 401 refetch, which would keep admin UI visible after logout.
- On login, seed the cache from the login response rather than invalidate-then-navigate; the latter races the route guard and can bounce the user back to the login page before the refetch lands.
- On logout, remove the query from the cache before navigating; invalidate alone leaves stale success data.

**Why:** the admin-me query is observed by both the route guard and the persistent nav. Without seed-on-login / clear-on-logout they disagree, producing wrong redirects or a stale admin panel.
