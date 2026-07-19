# Bridge Safi / Grado Eats

## Vue d'ensemble

Monorepo pnpm multi-applications :

- **`artifacts/api-server`** — Serveur Express (backend API, auth Clerk, PostgreSQL, Twilio)
- **`artifacts/bridge-finance`** — App React (interface finance/admin Bridge Safi)
- **`artifacts/grado-eats`** — App React principale (Eats, Taxi, Fleurs, Tabac, Pharmacie, Supermarché, Boulangerie, Souk)
- **`artifacts/grado`** — App React complémentaire
- **`lib/`** — Librairies partagées (api-client, api-spec, api-zod, db)

## Stack technique

- **Frontend** : React 19, Vite 7, TypeScript, TailwindCSS v4, Wouter (routing), TanStack Query
- **Backend** : Express 5, Drizzle ORM, PostgreSQL
- **Auth** : Clerk
- **Notifications** : Twilio (WhatsApp + appels)
- **Déploiement original** : Railway

## Variables d'environnement requises

Voir `.env.railway.example` pour la liste complète :
- `DATABASE_URL` — PostgreSQL
- `CLERK_SECRET_KEY` + `VITE_CLERK_PUBLISHABLE_KEY` — Auth Clerk
- `SESSION_SECRET` — Sessions (déjà configuré dans Replit Secrets)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — Notifications
- `VITE_GOOGLE_MAPS_KEY` — Google Maps (optionnel)

## Images des cartes de services (grado-eats)

Les photos des cartes sont définies dans `artifacts/grado-eats/src/App.tsx` dans `CARD_PHOTOS`.  
Les images locales sont dans `artifacts/grado-eats/public/`.

## Préférences utilisateur

- Langue de communication : **français**
