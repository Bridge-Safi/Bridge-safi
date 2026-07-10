---
name: Bridge Safi auth & order history
description: Custom JWT auth (not Clerk) and account-scoped order history patterns in artifacts/grado-eats.
---

## Auth
The app's `useUser`/`useAuth` hooks mimic Clerk's API but are a custom JWT system
(`bridge-auth.tsx` front-end, `routes/auth.ts` back-end). Do not assume real Clerk
behavior or SDK features are available.

## Order history must be account-scoped, not device-scoped
`orders` has no `userId` column — only `customerPhone` links an order to an account.
`GET /api/orders/mine` (JWT-protected) matches by the last 9 digits of the phone
number to tolerate old/unnormalized `customerPhone` values.

**Why:** history was originally read purely from `localStorage` (`bridge_history`),
which leaked between customers sharing a device and was lost on logout.

**How to apply:** When rendering account history (`HistoryPageRoute`,
`MyOrdersPageRoute`), merge server results with local `bridge_history` entries
(dedup by `ref`, keep the union) rather than replacing local state outright — the
phone typed at checkout doesn't always exactly match the account's registered
phone, so a server-only replace can make a just-placed order vanish from view even
though it's still in localStorage and still in the DB.

## i18n pattern
Central `T` dict (`fr`/`en`/`ar`/`amz`) in App.tsx, accessed via `const t = T[lang]`.
Many translation keys already exist in `T` but individual route components
sometimes render hardcoded French instead of wiring `t.someKey` — when fixing i18n
gaps, check `T` for an existing key before adding a new one, and make sure any
leaf/child component that needs translated text actually receives a `lang` prop
(several, e.g. `AdSlot`, `LocationPickerMap`, had a `lang='fr'` default that was
silently used because call sites forgot to pass it).
