---
name: Bridge Safi auth & order history
description: How authentication and per-customer order history work in the Bridge Safi monorepo (artifacts/grado-eats + artifacts/api-server) — relevant for any bug involving accounts, sessions, or "my orders" history.
---

- Despite hook names (`useUser`, `useAuth`) matching Clerk's API, this app uses a **home-grown JWT auth system** (`artifacts/grado-eats/src/bridge-auth.tsx` on the frontend, `artifacts/api-server/src/routes/auth.ts` on the backend). There is no real Clerk integration wired up for grado-eats despite leftover Clerk env var names in `.env.railway.example`.
- Users are identified by phone or email in a `users` table; JWTs are custom HS256 signed with `SESSION_SECRET`.
- `ordersTable` (`lib/db/src/schema/orders.ts`) has **no `userId` column** — orders are only linked to a customer via `customerPhone`. Any per-account order feature must key off phone (normalized via `normalizePhone` in `auth.ts`), not a user id foreign key.
- **Why this matters:** the "Suivre mes commandes"/"Historique" screens originally read only from `localStorage` (`bridge_history`), which is scoped to the *device/browser*, not the account — so it leaked across customers sharing a device and disappeared on logout. Fixed by adding `GET /api/orders/mine` (JWT-authenticated, filters `ordersTable` by the account's normalized phone, with a last-9-digit fallback match for legacy unnormalized rows) and having the frontend prefer that endpoint when signed in.
- **How to apply:** any new "my data" feature in grado-eats (orders, favorites, etc.) should be scoped server-side by the authenticated account (phone/user id), not by local device storage — the same class of bug is likely to recur elsewhere in this codebase given the existing localStorage-heavy patterns (e.g. `bridge_history`, `bridge_jwt`, `bridge_user_cache` are all plain localStorage keys used broadly in `App.tsx`).
