import { Router } from "express";
import { db, restaurantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

const BRIDGE_INBOUND_SECRET = process.env.BRIDGE_INBOUND_SECRET ?? "bridge-safi-8b269bba03fd8c0205116f3f";

const RESTAURANT_PINS: Record<string, string> = {
  "McDonald's Safi":      "1234",
  "Bridge Pizza & Tacos": "2345",
  "Safi Seafood Palace":  "3456",
  "Kebab Express Safi":   "4567",
  "Burger Corner Safi":   "5678",
};

function checkPin(name: string, pin: string): boolean {
  const correct = RESTAURANT_PINS[name];
  return !!correct && pin === correct;
}

// GET /api/restaurant/profile?name=X&pin=Y
router.get("/restaurant/profile", async (req, res) => {
  const name = (req.query.name as string || "").trim();
  const pin  = (req.query.pin  as string || "").trim();
  if (!name || !pin) { res.status(400).json({ error: "name and pin required" }); return; }
  if (!checkPin(name, pin)) { res.status(401).json({ error: "PIN incorrect" }); return; }

  try {
    const rows = await db.select().from(restaurantsTable).where(eq(restaurantsTable.name, name));
    const profile = rows[0] ?? { name, phone: null, address: null, lat: null, lng: null, webhookUrl: null };
    res.json({ profile, bridgeSecret: BRIDGE_INBOUND_SECRET });
  } catch (err) {
    req.log.error({ err }, "restaurant profile fetch failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/restaurant/profile
router.patch("/restaurant/profile", async (req, res) => {
  const { name, pin, phone, address, lat, lng, webhookUrl } = req.body as {
    name?: string; pin?: string; phone?: string; address?: string;
    lat?: number; lng?: number; webhookUrl?: string;
  };
  if (!name || !pin) { res.status(400).json({ error: "name and pin required" }); return; }
  if (!checkPin(name.trim(), pin.trim())) { res.status(401).json({ error: "PIN incorrect" }); return; }

  try {
    await db
      .insert(restaurantsTable)
      .values({
        name: name.trim(),
        phone:      phone      ?? null,
        address:    address    ?? null,
        lat:        typeof lat === "number" ? lat : null,
        lng:        typeof lng === "number" ? lng : null,
        webhookUrl: webhookUrl ?? null,
        updatedAt:  new Date(),
      })
      .onConflictDoUpdate({
        target: restaurantsTable.name,
        set: {
          phone:      phone      ?? null,
          address:    address    ?? null,
          lat:        typeof lat === "number" ? lat : null,
          lng:        typeof lng === "number" ? lng : null,
          webhookUrl: webhookUrl ?? null,
          updatedAt:  new Date(),
        },
      });
    req.log.info({ name }, "restaurant profile updated");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "restaurant profile update failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
