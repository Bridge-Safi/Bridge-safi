import { Router } from "express";
import { db, restaurantsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { clerkClient, verifyToken } from "@clerk/express";
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

// Helper — get Clerk userId from Bearer token
async function getClerkUserId(authHeader: string | undefined): Promise<{userId:string;email:string}|null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
    const userId = payload.sub;
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress ?? "";
    return { userId, email };
  } catch {
    return null;
  }
}

// GET /api/restaurant/me  — get restaurant linked to Clerk account
router.get("/restaurant/me", async (req, res) => {
  const clerk = await getClerkUserId(req.headers.authorization);
  if (!clerk) { res.status(401).json({ error: "Non authentifié" }); return; }

  try {
    const rows = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerId, clerk.userId));
    if (rows.length === 0) { res.json({ restaurant: null }); return; }
    res.json({ restaurant: rows[0], bridgeSecret: BRIDGE_INBOUND_SECRET });
  } catch (err) {
    req.log.error({ err }, "restaurant/me fetch failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/restaurant/claim — link a restaurant to Clerk account (first time)
router.post("/restaurant/claim", async (req, res) => {
  const clerk = await getClerkUserId(req.headers.authorization);
  if (!clerk) { res.status(401).json({ error: "Non authentifié" }); return; }

  const { name, pin } = req.body as { name?: string; pin?: string };
  if (!name || !pin) { res.status(400).json({ error: "name et pin requis" }); return; }
  if (!checkPin(name.trim(), pin.trim())) { res.status(401).json({ error: "PIN incorrect" }); return; }

  try {
    // Check not already owned by someone else
    const existing = await db.select().from(restaurantsTable).where(eq(restaurantsTable.name, name.trim()));
    if (existing.length > 0 && existing[0].ownerId && existing[0].ownerId !== clerk.userId) {
      res.status(409).json({ error: "Ce restaurant est déjà lié à un autre compte" }); return;
    }

    await db
      .insert(restaurantsTable)
      .values({ name: name.trim(), ownerId: clerk.userId, ownerEmail: clerk.email, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: restaurantsTable.name,
        set: { ownerId: clerk.userId, ownerEmail: clerk.email, updatedAt: new Date() },
      });

    req.log.info({ name, userId: clerk.userId }, "restaurant claimed");
    const rows = await db.select().from(restaurantsTable).where(eq(restaurantsTable.name, name.trim()));
    res.json({ ok: true, restaurant: rows[0], bridgeSecret: BRIDGE_INBOUND_SECRET });
  } catch (err) {
    req.log.error({ err }, "restaurant claim failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/restaurant/profile?name=X&pin=Y  (legacy PIN login — kept for compatibility)
router.get("/restaurant/profile", async (req, res) => {
  // Try Clerk auth first
  const clerk = await getClerkUserId(req.headers.authorization);
  if (clerk) {
    const rows = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerId, clerk.userId));
    const profile = rows[0] ?? null;
    res.json({ profile, bridgeSecret: BRIDGE_INBOUND_SECRET });
    return;
  }

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
  // Try Clerk auth first
  const clerk = await getClerkUserId(req.headers.authorization);

  const { name, pin, phone, address, lat, lng, webhookUrl } = req.body as {
    name?: string; pin?: string; phone?: string; address?: string;
    lat?: number; lng?: number; webhookUrl?: string;
  };

  let resolvedName: string | undefined;

  if (clerk) {
    // Find their restaurant by ownerId
    const rows = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerId, clerk.userId));
    if (rows.length > 0) {
      resolvedName = rows[0].name;
    } else if (name) {
      resolvedName = name.trim();
    }
  } else {
    if (!name || !pin) { res.status(400).json({ error: "name and pin required" }); return; }
    if (!checkPin(name.trim(), pin.trim())) { res.status(401).json({ error: "PIN incorrect" }); return; }
    resolvedName = name.trim();
  }

  if (!resolvedName) { res.status(400).json({ error: "Restaurant non trouvé" }); return; }

  try {
    await db
      .insert(restaurantsTable)
      .values({
        name: resolvedName,
        phone:      phone      ?? null,
        address:    address    ?? null,
        lat:        typeof lat === "number" ? lat : null,
        lng:        typeof lng === "number" ? lng : null,
        webhookUrl: webhookUrl ?? null,
        ownerId:    clerk?.userId ?? null,
        ownerEmail: clerk?.email  ?? null,
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
    req.log.info({ name: resolvedName }, "restaurant profile updated");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "restaurant profile update failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
