import { Router } from "express";
import { logger } from "../lib/logger";
import { notifyDrivers } from "./push";

const router = Router();

interface TrackPos {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  eta?: number;
  updatedAt: number;
  status?: string;
  clientLat?: number;
  clientLng?: number;
  clientAddress?: string;
  destination?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  driverRating?: number;
  customerName?: string;
  customerPhone?: string;
  clientPrice?: number;
  driverPrice?: number;
  // Commerce (Eats/Pharmacie/Tabac/Fleurs/Boulangerie/Souk/Supermarche) — point
  // de depart + logo affiches sur la carte de suivi (2026-07-10, demande zabi).
  shopLat?: number;
  shopLng?: number;
  shopName?: string;
  shopEmoji?: string;
}

// Position pseudo-geocodee deterministe (pas de vraie geocodification disponible) :
// le meme texte (nom de commerce ou adresse) retombe toujours au meme point,
// disperse dans un rayon ~1.3km autour du centre de Safi. Suffisant pour donner
// une carte de suivi visuellement realiste avec un point different par commerce/adresse.
function pseudoGeo(seed: string): { lat: number; lng: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  h = h >>> 0;
  const latOff = ((h % 1000) / 1000 - 0.5) * 0.026;
  const lngOff = ((Math.floor(h / 1000) % 1000) / 1000 - 0.5) * 0.026;
  return { lat: 32.2994 + latOff, lng: -9.2372 + lngOff };
}

// In-memory store: orderRef → position  (auto-expires after 3h)
const positions = new Map<string, TrackPos>();
const TTL_MS = 3 * 60 * 60 * 1000;

/**
 * Update (or create) the tracking status for an order ref.
 * Used server-side by other routes (restaurant callback, by-ref status update)
 * to keep the tracking store in sync with the DB so the customer sees real-time changes.
 */
export function syncTrackingStatus(ref: string, status: string): void {
  const existing = positions.get(ref);
  positions.set(ref, {
    lat: existing?.lat ?? 0,
    lng: existing?.lng ?? 0,
    ...existing,
    status,
    updatedAt: Date.now(),
  });
}

/**
 * Lecture seule du nom/photo du livreur actuellement assigne a une commande
 * (utilise par le signalement client -> alerte WhatsApp admin, 2026-07-10).
 */
export function getTrackedDriver(ref: string): { name?: string; photo?: string; phone?: string } | undefined {
  const pos = positions.get(ref);
  if (!pos) return undefined;
  return { name: pos.driverName, photo: pos.driverPhoto, phone: pos.driverPhone };
}

function cleanup() {
  const now = Date.now();
  for (const [ref, pos] of positions) {
    if (now - pos.updatedAt > TTL_MS) positions.delete(ref);
  }
}
setInterval(cleanup, 10 * 60 * 1000);

// ── Driver live positions (for smart dispatch) ────────────────────────────────
// endpoint → { lat, lng, driverName, updatedAt }
// Drivers on the dispatch page report their GPS every 30s
export interface DriverLoc {
  lat: number;
  lng: number;
  driverName?: string;
  updatedAt: number;
}
const driverPositions = new Map<string, DriverLoc>();
const DRIVER_TTL_MS = 5 * 60 * 1000; // 5 minutes without ping = offline

function cleanupDrivers() {
  const now = Date.now();
  for (const [ep, loc] of driverPositions) {
    if (now - loc.updatedAt > DRIVER_TTL_MS) driverPositions.delete(ep);
  }
}
setInterval(cleanupDrivers, 60 * 1000);

/** Returns map of endpoint → DriverLoc for all currently-active drivers. */
export function getDriverPositions(): Map<string, DriverLoc> {
  cleanupDrivers();
  return driverPositions;
}

// Driver → report their live GPS (called every 30s from dispatch page)
router.post("/tracking/driver-location", (req, res) => {
  const { endpoint, lat, lng, driverName } = req.body;
  if (!endpoint || typeof lat !== "number" || typeof lng !== "number") {
    res.status(400).json({ error: "endpoint, lat and lng required" });
    return;
  }
  driverPositions.set(endpoint, { lat, lng, driverName: driverName || undefined, updatedAt: Date.now() });
  res.json({ ok: true });
});

// List pending bookings for driver dispatch panel
// ?type=taxi (default) → TC- refs  |  ?type=moto → MT- refs
router.get("/tracking-pending", (req, res) => {
  const type = (req.query.type as string) === 'moto' ? 'moto' : 'taxi';
  const prefix = type === 'moto' ? 'MT-' : 'TC-';
  const pending: Array<{ ref: string } & TrackPos> = [];
  for (const [ref, pos] of positions) {
    if (ref.startsWith(prefix) && pos.status === 'waiting') {
      pending.push({ ref, ...pos });
    }
  }
  res.set("Cache-Control", "no-store");
  res.json({ bookings: pending });
});

// Client → create taxi booking (initial, status=waiting) OU initialiser le
// suivi d'une commande commerce (Eats/Pharmacie/Tabac/Fleurs/Boulangerie/Souk/
// Supermarche) avec kind:'shop' — dans ce cas pas de notification "Nouvelle
// course Taxi" (le dispatch commerce a deja son propre circuit de notif).
router.post("/tracking/:ref", (req, res) => {
  const { ref } = req.params;
  const { clientLat, clientLng, clientAddress, destination, customerName, customerPhone, clientPrice, shopName, shopEmoji, kind } = req.body;
  const isShop = kind === 'shop';
  const existing = positions.get(ref);
  const resolvedClient = (typeof clientLat === 'number' && typeof clientLng === 'number')
    ? { lat: clientLat, lng: clientLng }
    : (clientAddress ? pseudoGeo('client:' + clientAddress) : { lat: 32.2994, lng: -9.2372 });
  const resolvedShop = shopName ? pseudoGeo('shop:' + shopName) : undefined;
  // IMPORTANT : lat/lng (racine) = position GPS REELLE du livreur, jamais une
  // position deduite/pseudo. Pour une commande commerce (kind:'shop'), on ne
  // connait pas encore de vrai livreur a l'init (checkout) : on laisse donc
  // lat/lng a 0 (comme avant, via syncTrackingStatus) pour que le frontend
  // (hasRealGPS = |lat|>0.001) ne prenne pas la position du client/commerce
  // pour un GPS livreur en direct. Corrige le bug "le GPS du livreur envoie
  // vers une adresse differente" (2026-07-10) — regression du commit precedent
  // qui ecrasait lat/lng avec clientLat/clientLng des l'initialisation.
  positions.set(ref, {
    lat: existing?.lat ?? (isShop ? 0 : (typeof clientLat === 'number' ? clientLat : 32.2994)),
    lng: existing?.lng ?? (isShop ? 0 : (typeof clientLng === 'number' ? clientLng : -9.2372)),
    ...existing,
    status: existing?.status ?? 'waiting',
    updatedAt: existing?.updatedAt ?? Date.now(),
    clientLat: existing?.clientLat ?? resolvedClient.lat,
    clientLng: existing?.clientLng ?? resolvedClient.lng,
    clientAddress: clientAddress ?? existing?.clientAddress,
    destination: destination ?? existing?.destination,
    customerName: customerName ?? existing?.customerName,
    customerPhone: customerPhone ?? existing?.customerPhone,
    clientPrice: (typeof clientPrice === 'number' && clientPrice > 0) ? clientPrice : existing?.clientPrice,
    shopLat: existing?.shopLat ?? resolvedShop?.lat,
    shopLng: existing?.shopLng ?? resolvedShop?.lng,
    shopName: shopName ?? existing?.shopName,
    shopEmoji: shopEmoji ?? existing?.shopEmoji,
  });
  req.log.info({ ref, isShop }, isShop ? "shop order tracking initialized" : "taxi booking created");
  res.json({ ok: true });

  if (!isShop) {
    // Notify all drivers with push notification (taxi/moto uniquement)
    notifyDrivers({
      type: "NEW_TAXI",
      title: "🚖 Nouvelle course Taxi !",
      body: `${customerName || 'Client'} → ${destination || '?'} · ${clientAddress || 'Safi'}`,
      data: { ref, url: "/dispatch" },
    }).catch(() => {});
  }
});

// Driver → push position / update status
router.put("/tracking/:ref", (req, res) => {
  const { ref } = req.params;
  const { lat, lng, heading, speed, eta, status, driverName, driverPhone, driverPhoto, driverRating, driverPrice } = req.body;
  const existing = positions.get(ref);
  if (lat !== undefined && lng !== undefined &&
      (typeof lat !== "number" || typeof lng !== "number")) {
    res.status(400).json({ error: "lat and lng must be numbers" });
    return;
  }
  const updated: TrackPos = {
    ...(existing ?? { lat: lat ?? 0, lng: lng ?? 0, updatedAt: Date.now() }),
    ...(lat !== undefined ? { lat } : {}),
    ...(lng !== undefined ? { lng } : {}),
    ...(heading !== undefined ? { heading } : {}),
    ...(speed !== undefined ? { speed } : {}),
    ...(eta !== undefined ? { eta } : {}),
    ...(status ? { status } : {}),
    ...(driverName ? { driverName } : {}),
    ...(driverPhone ? { driverPhone } : {}),
    ...(driverPhoto ? { driverPhoto } : {}),
    ...(typeof driverRating === 'number' ? { driverRating } : {}),
    ...(typeof driverPrice === 'number' ? { driverPrice } : {}),
    updatedAt: Date.now(),
  };
  positions.set(ref, updated);
  req.log.info({ ref, lat, lng, status }, "tracking position updated");
  res.json({ ok: true });
});

// Client → get position + status
router.get("/tracking/:ref", (req, res) => {
  const { ref } = req.params;
  const pos = positions.get(ref);
  if (!pos) {
    res.status(404).json({ found: false });
    return;
  }
  res.set("Cache-Control", "no-store");
  res.json({ found: true, ...pos });
});

// Driver → signal delivered (clear position)
router.delete("/tracking/:ref", (req, res) => {
  positions.delete(req.params.ref);
  res.json({ ok: true });
});

export default router;
