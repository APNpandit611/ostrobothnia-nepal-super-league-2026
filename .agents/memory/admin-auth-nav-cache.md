---
name: Admin auth state in shared Layout
description: How the React frontend gates admin nav UI on the admin-me query, and the cache rules that keep it in sync across login/logout.
---

The admin session is cookie-based (separate from Clerk). `useGetAdminMe` (GET `/api/auth/me`, returns `AuthResponse` with `isAdmin`, 401 when not an admin) is the single source of truth for whether to show admin-only UI.

The shared `Layout` renders a persistent "Admin Panel" nav section on every page when `isAdmin`, so admins keep access to admin tools while browsing public pages.

**Rules any admin-gated UI must follow (or the nav goes stale):**
- Derive admin state as `!isError && !!data?.isAdmin` — NOT just `!!data?.isAdmin`. A previously-successful query can still expose old `data` during/after a 401 refetch, which would keep the admin UI visible after logout.
- On **login** success, seed the cache: `queryClient.setQueryData(getGetAdminMeQueryKey(), data)` (login returns the same `AuthResponse`). Plain `invalidateQueries` + immediate navigate races the AuthGuard, which can redirect back to the login page before the refetch lands.
- On **logout** success, `queryClient.removeQueries({ queryKey: getGetAdminMeQueryKey() })` before navigating. `invalidateQueries` leaves stale success data around.

**Why:** the same admin-me query is observed by both `AuthGuard` and `Layout`; without seed-on-login / clear-on-logout the sidebar and the guard disagree, producing wrong redirects or a stale admin panel.

**How to apply:** when adding any component that shows/hides UI based on admin status, reuse `useGetAdminMe` with a small `staleTime` (dedupes the shared `/api/auth/me` calls) and follow the three rules above.
