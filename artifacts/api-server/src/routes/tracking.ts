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
  // Taxi-specific
  status?: 'waiting' | 'accepted' | 'arrived' | 'completed';
  clientLat?: number;
  clientLng?: number;
  clientAddress?: string;
  destination?: string;
  driverName?: string;
  customerName?: string;
  customerPhone?: string;
}

// In-memory store: orderRef → position  (auto-expires after 3h)
const positions = new Map<string, TrackPos>();
const TTL_MS = 3 * 60 * 60 * 1000;

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

// Client → create taxi booking (initial, status=waiting)
router.post("/tracking/:ref", (req, res) => {
  const { ref } = req.params;
  const { clientLat, clientLng, clientAddress, destination, customerName, customerPhone } = req.body;
  positions.set(ref, {
    lat: clientLat ?? 32.2994,
    lng: clientLng ?? -9.2372,
    updatedAt: Date.now(),
    status: 'waiting',
    clientLat: clientLat ?? undefined,
    clientLng: clientLng ?? undefined,
    clientAddress: clientAddress ?? undefined,
    destination: destination ?? undefined,
    customerName: customerName ?? undefined,
    customerPhone: customerPhone ?? undefined,
  });
  req.log.info({ ref }, "taxi booking created");
  res.json({ ok: true });

  // Notify all drivers with push notification
  notifyDrivers({
    type: "NEW_TAXI",
    title: "🚖 Nouvelle course Taxi !",
    body: `${customerName || 'Client'} → ${destination || '?'} · ${clientAddress || 'Safi'}`,
    data: { ref, url: "/dispatch" },
  }).catch(() => {});
});

// Driver → push position / update status
router.put("/tracking/:ref", (req, res) => {
  const { ref } = req.params;
  const { lat, lng, heading, speed, eta, status, driverName } = req.body;
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
