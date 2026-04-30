import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

interface TrackPos {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  eta?: number;
  updatedAt: number;
  // Taxi-specific
  status?: 'waiting' | 'accepted' | 'arrived';
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
