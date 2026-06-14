---
name: Custom fetch credentials
description: All API calls must include credentials or session cookies are never sent, causing auth to always return 401.
---

The `customFetch` function in `lib/api-client-react/src/custom-fetch.ts` must pass `credentials: "include"` to the native `fetch` call. Without it, the browser never attaches the session cookie (`nepal_admin_session`) to API requests, so `GET /api/auth/me` always returns 401 even after a successful login.

**Why:** The frontend Vite dev server and the Express API run on different ports. Even though the Replit proxy serves them from the same domain, the browser treats the fetch as cross-origin for cookie purposes unless `credentials: "include"` is set. The deployed (HTTPS) version has the same issue.

**How to apply:** If auth ever breaks again (login succeeds but dashboard redirects back to login), check this line first:
```ts
const response = await fetch(input, { ...init, method, headers, credentials: "include" });
```
It must include `credentials: "include"`.
