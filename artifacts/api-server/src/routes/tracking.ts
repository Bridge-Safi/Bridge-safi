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

// Driver → push position
router.put("/tracking/:ref", (req, res) => {
  const { ref } = req.params;
  const { lat, lng, heading, speed, eta } = req.body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    res.status(400).json({ error: "lat and lng required" });
    return;
  }
  positions.set(ref, { lat, lng, heading, speed, eta, updatedAt: Date.now() });
  req.log.info({ ref, lat, lng }, "tracking position updated");
  res.json({ ok: true });
});

// Client → get position
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
