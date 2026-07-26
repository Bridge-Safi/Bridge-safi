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

## Routing des courses Taxi & Moto

Les courses sont envoyées au site livreur (`DRIVER_APP_URL = https://livreur.safi-bridge.ma`) via `POST /api/trips` avec les `vehicleType` suivants :

| Service | vehicleType envoyé | Pool de chauffeurs |
|---|---|---|
| Taxi Confort | `taxi` | Chauffeurs taxi confort uniquement |
| Moto Taxi | `moto_taxi` | Motards taxi uniquement |
| Livraisons (Eats, Tabac…) | `car` / `moto` via `/api/deliveries` | Livreurs standard |

> ⚠️ Ne jamais remettre `vehicleType:'car'` pour Taxi Confort — les courses partiraient dans la pool livreurs et ne seraient jamais acceptées par les chauffeurs taxi.

## Tarifs suggérés (InDrive Safi -6%)

Les pages Taxi Confort et Moto Taxi calculent automatiquement un prix suggéré dès que le client saisit sa destination. Formule :
- **Taxi Confort** : `max(15, 15 + km × 2.5) × 0.94`, arrondi au 5 DH
- **Moto Taxi** : `max(10, 10 + km × 1.8) × 0.94`, arrondi au 5 DH

Distance calculée à vol d'oiseau (×1.3 pour les routes) via Nominatim + position GPS du client.

## Photos des cartes de services (grado-eats)

Les photos sont définies dans `artifacts/grado-eats/src/App.tsx` (chercher `CARD_PHOTOS` ~ligne 7530).  
Les images locales sont dans `artifacts/grado-eats/public/`.

Le zoom des photos est réglé à `scale(1.5)` centré sur le contenu pour toutes les cartes.

## Préférences utilisateur

- Langue de communication : **français**
