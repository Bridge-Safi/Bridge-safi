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

## Lancer le projet sur Replit

### Frontend grado-eats (port 8080)

Le workflow **`artifacts/grado-eats: Dev Server`** lance automatiquement le frontend :

```bash
cd artifacts/grado-eats && PORT=8080 BASE_PATH=/ pnpm dev
```

Variables d'environnement requises : `PORT` et `BASE_PATH` (déjà configurés dans le workflow).

### Backend api-server (port 8080 en prod / à configurer)

```bash
cd artifacts/api-server && pnpm dev
```

Requiert les secrets ci-dessous.

## Variables d'environnement requises

Voir `.env.railway.example` pour la liste complète :

| Variable | Description | Statut |
|---|---|---|
| `DATABASE_URL` | PostgreSQL | ⚠️ À configurer |
| `CLERK_SECRET_KEY` | Auth Clerk (backend) | ⚠️ À configurer |
| `VITE_CLERK_PUBLISHABLE_KEY` | Auth Clerk (frontend) | ⚠️ À configurer |
| `SESSION_SECRET` | Sessions Express | ✅ Configuré |
| `TWILIO_ACCOUNT_SID` | Notifications WhatsApp | ⚠️ Optionnel |
| `TWILIO_AUTH_TOKEN` | Notifications WhatsApp | ⚠️ Optionnel |
| `TWILIO_PHONE_NUMBER` | Numéro Twilio | ⚠️ Optionnel |
| `VITE_GOOGLE_MAPS_KEY` | Google Maps | ⚠️ Optionnel |

## Photos des cartes de services (grado-eats)

Les photos sont définies dans `artifacts/grado-eats/src/App.tsx` (chercher `CARD_PHOTOS` ~ligne 7530).  
Les images locales sont dans `artifacts/grado-eats/public/`.

Le zoom des photos est réglé à `scale(1.5)` centré sur le contenu pour toutes les cartes.

## Préférences utilisateur

- Langue de communication : **français**
