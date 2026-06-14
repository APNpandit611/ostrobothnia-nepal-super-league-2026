---
name: Clerk OAuth integration
description: How Clerk replaces OTP for team registration/squad update — setup quirks and patterns.
---

## What was replaced
OTP email verification (send-otp / verify-otp) was removed from the register-team and update-squad flows. Clerk Google/Facebook OAuth is now the identity proof.

## Key setup rules

### Tailwind v4 + Clerk
- `vite.config.ts`: `tailwindcss({ optimize: false })` — must disable optimization or Clerk styles conflict.
- `index.css`: `@layer theme, base, clerk, components, utilities;` MUST appear BEFORE `@import "tailwindcss"`.

### ClerkProvider structure
- `publishableKeyFromHost` comes from `@clerk/react/internal` (client), not `@clerk/shared/keys` (server).
- `clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL` — set for prod by the platform, empty in dev. Never gate on NODE_ENV.
- WouterRouter wraps ClerkProviderWithRoutes (ClerkProvider needs `useLocation` from wouter for `routerPush`/`routerReplace`).
- Routes MUST be `/sign-in/*?` and `/sign-up/*?` (optional wildcard) for OAuth callbacks to work.
- `<SignIn>` needs `routing="path"` and `path={`${basePath}/sign-in`}` (full path including basePath).

### API server (Express)
- `getAuth` and `clerkClient` both importable from `@clerk/express`.
- Clerk proxy middleware must mount BEFORE body parsers: `app.use(CLERK_PROXY_PATH, clerkProxyMiddleware())`.
- `clerkMiddleware` comes after cors + cookie-parser but before routes.
- Server-side: `publishableKeyFromHost` from `@clerk/shared/keys`.

### Identity verification logic (update-squad)
- If team has `managerEmail` set: require Clerk user email to match.
- If team has no `managerEmail`: allow any authenticated user and claim the team (set their email as managerEmail on first update).

### useListPlayers hook (Orval + TanStack Query v5)
- Signature: `useListPlayers(teamId: number, options?: { query?: UseQueryOptions; request?: ... })`.
- `enabled` inside `query` causes TS error because `UseQueryOptions` requires `queryKey`. Workaround: pass `teamId ?? 0` and guard in `useEffect` with `if (teamId && ...)` instead of using `enabled`.

## Facebook OAuth
Google is enabled by default. Facebook requires the user to enable it in the Replit Auth pane (Social Connections). The sign-in UI will automatically show the Facebook button once enabled.

**Why:** Clerk Replit-managed instances are configured via the Replit Auth UI, not dashboard.clerk.com.
