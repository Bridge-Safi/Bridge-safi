# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Authentication**: Clerk (email/password + Google + social providers)
- **Routing**: Wouter (client-side)
- **State**: TanStack React Query
- **Build**: esbuild (CJS bundle)

## Authentication

- **Customers**: Clerk — email/password, Google (configure providers in Auth pane)
- **Drivers**: Clerk account + secret driver code (`DRIVER_CODE` env var, default: `BRIDGE-DRIVER-2025`)
- Sign-in page: `/sign-in`, sign-up page: `/sign-up`
- Checkout requires sign-in; driver panel requires sign-in + driver code

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Payment System (Bridge Safi)

All 4 services support the same payment options:
- **Apple Pay** — native wallet (via PaymentRequest API; falls back gracefully)
- **Google Pay** — native wallet (same API)
- **QR Code** — bank QR code (`BRIDGE_QR_PAY_URL` constant in App.tsx, line ~198) — shows QRPayModal with a generated QR image. Update the URL to the merchant's bank payment link.
- **Cash** — espèces à la livraison (all services except Fleurs/Eats collect mode)
- **Card** — Visa/Mastercard CMI form (Bridge Eats checkout only)

Key shared components in `App.tsx`:
- `QRPayModal` — bottom-sheet modal showing the QR + instructions + "J'ai payé" confirm
- `SharedPaymentOptions` — reusable payment method selector (Apple/Google Pay buttons + QR/Cash/Card toggles)
- `PayMethodType` — shared type `'cash'|'card'|'qr'|'apple'|'google'|null`

To update the bank QR: change `BRIDGE_QR_PAY_URL` near line 198 in `artifacts/grado-eats/src/App.tsx`.

## Bridge Game — Règles

- Route: `/game` (requires Clerk auth)
- Rules modal triggered by "📜 Règles du jeu" button (top-right), 4 languages, full rules explanation
- `GameRulesModal` component in `main.tsx` above `GamePage`
- Rules: 2 days × 3h/day = 6h; 1,000 💎/hour; 6,000 💎 target; missing 1,000 💎 = 5 DH; free delivery bonus at 7h

## Bridge AI Assistant

- Route: `/assistant` (accessible without auth)
- Chat page backed by OpenAI (`gpt-4o-mini`) via Replit AI Integrations proxy
- API endpoint: `POST /api/assistant/chat` — body: `{ messages, lang }`
- System prompt: trained on all 4 Bridge services, order tracking, delivery, payment, game rules
- Escalation: reply contains `[ESCALADE]` → frontend shows WhatsApp alert + button
- Quick question buttons: suivi commande, retard livraison, paiement, autre
- 4-language support: FR/EN/AR/AMZ
- Owner WhatsApp: `+212600000000` (update in `BridgeAssistantPage` constant `BRIDGE_WA_NUMBER`)
