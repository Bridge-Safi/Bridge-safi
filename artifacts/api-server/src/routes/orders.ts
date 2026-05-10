import { Router, Request, Response, NextFunction } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { notifyDrivers, notifySpecificDrivers, notifyDriversExcept } from "./push";
import { getDriverPositions } from "./tracking";
import { addSSEClient, removeSSEClient, broadcastOrder } from "../lib/sse";
import { logger } from "../lib/logger";
import { notifyRestaurant } from "../lib/notify-restaurant";

// ── Auth keys (env vars — ne jamais hardcoder en production) ─────────────────
const DRIVER_KEY           = process.env.DRIVER_KEY           ?? "BRIDGE-DRIVER-2025";
const BRIDGE_INBOUND_SECRET = process.env.BRIDGE_INBOUND_SECRET ?? "bridge-safi-8b269bba03fd8c0205116f3f";

/** Middleware — vérifie que le livreur envoie la bonne clé (header ou query) */
function requireDriverKey(req: Request, res: Response, next: NextFunction): void {
  const key = (req.headers["x-driver-key"] as string | undefined)
           ?? (req.query.driverKey as string | undefined);
  if (key !== DRIVER_KEY) {
    res.status(401).json({ error: "Accès non autorisé — clé livreur invalide" });
    return;
  }
  next();
}

/** Middleware — vérifie l'authentification Clerk du client */
function requireClerkAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  next();
}

// ── Restaurant coordinates in Safi ───────────────────────────────────────────
// Used for proximity-based smart dispatch (notify nearest drivers first)
const RESTAURANT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Kebab Express Safi":    { lat: 32.3012, lng: -9.2305 },
  "Pizza Safi":            { lat: 32.2980, lng: -9.2350 },
  "Burger House Safi":     { lat: 32.3040, lng: -9.2290 },
  "Restaurant Al Bahr":    { lat: 32.2930, lng: -9.2320 },
  "Café Central Safi":     { lat: 32.2994, lng: -9.2372 },
  // Default Safi centre médina
  "__default__":           { lat: 32.2994, lng: -9.2372 },
};

/** Haversine distance in km between two GPS points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const NEARBY_KM = 2;       // radius to notify first
const DISPATCH_DELAY = 120_000; // 2 minutes in ms

/** Smart dispatch: notify nearby drivers first, then ALL remaining after 2 min.
 *
 *  Bug fix: "far" list only included GPS-tracked drivers. Drivers whose position
 *  wasn't yet reported (page not yet open, GPS initializing) were invisible and
 *  never notified. Now after 2 min we notify ALL subscriptions except those
 *  already notified, so no driver is ever skipped.
 */
async function smartDispatch(restaurantName: string | null | undefined, payload: object) {
  const coordKey = (restaurantName && RESTAURANT_COORDS[restaurantName]) ? restaurantName : "__default__";
  const { lat: rLat, lng: rLng } = RESTAURANT_COORDS[coordKey];

  const driverMap = getDriverPositions();
  const nearbyEndpoints: string[] = [];

  for (const [endpoint, loc] of driverMap) {
    const dist = haversineKm(rLat, rLng, loc.lat, loc.lng);
    if (dist <= NEARBY_KM) nearbyEndpoints.push(endpoint);
  }

  if (nearbyEndpoints.length > 0) {
    // Notify nearby drivers immediately
    await notifySpecificDrivers(nearbyEndpoints, payload);
    logger.info({ nearbyCount: nearbyEndpoints.length }, "smart dispatch: nearby drivers notified first");

    // After 2 minutes, notify ALL subscribed drivers EXCEPT those already notified.
    // This catches drivers not yet GPS-tracked (page opening, GPS initializing, etc.)
    const alreadyNotified = new Set(nearbyEndpoints);
    setTimeout(() => {
      notifyDriversExcept(alreadyNotified, payload).catch(() => {});
      logger.info({ excludedCount: alreadyNotified.size }, "smart dispatch: 2-min broadcast sent to remaining drivers");
    }, DISPATCH_DELAY);
  } else {
    // No nearby drivers — notify everyone immediately
    await notifyDrivers(payload);
    logger.info("smart dispatch: no nearby drivers, notified all immediately");
  }
}

const router = Router();

// ── Webhooks par restaurant ─────────────────────────────────────────────────
const RESTAURANT_WEBHOOKS: Record<string, string> = {
  "Kebab Express Safi": "https://303eedda-22da-41f3-8687-e84c69502bcd-00-2g2wlpsf6p1h3.riker.replit.dev/api/webhook/orders",
};

async function forwardToRestaurant(order: typeof ordersTable.$inferSelect) {
  const webhookUrl = order.restaurantName
    ? RESTAURANT_WEBHOOKS[order.restaurantName]
    : undefined;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bridge-secret": BRIDGE_INBOUND_SECRET },
      body: JSON.stringify({
        ref: order.ref,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.customerAddress,
        items: order.items,
        total: order.total,
        deliveryMode: order.deliveryMode,
        paymentMethod: order.paymentMethod,
        restaurantName: order.restaurantName,
        status: order.status,
        createdAt: order.createdAt,
      }),
    });
    logger.info({ ref: order.ref, restaurant: order.restaurantName }, "Order forwarded to restaurant webhook");
  } catch (err) {
    logger.error({ err, restaurant: order.restaurantName }, "Failed to forward order to restaurant webhook");
  }
}

// ── Webhook entrant partenaire (ex: Bridge Eats) ────────────────────────────
router.post("/orders/inbound", async (req, res) => {
  try {
    const secret = req.headers["x-bridge-secret"];
    if (secret !== BRIDGE_INBOUND_SECRET) {
      res.status(401).json({ error: "Unauthorized — invalid secret" }); return;
    }

    const {
      customerName,
      customerPhone,
      deliveryAddress,
      pickupAddress,
      items,
      total,
      source,
      paymentMethod,
    } = req.body;

    if (!customerName || !customerPhone || !deliveryAddress || !items || total === undefined) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }

    const ref = `EXT-${Math.floor(1000 + Math.random() * 9000)}`;
    const restaurantLabel = pickupAddress
      ? `${pickupAddress}${source ? ` (${source})` : ""}`
      : source || "Partenaire externe";

    const [order] = await db.insert(ordersTable).values({
      ref,
      service: "delivery",
      customerName,
      customerPhone,
      customerAddress: deliveryAddress,
      items,
      total: Number(total),
      deliveryMode: "delivery",
      paymentMethod: paymentMethod || "cash",
      restaurantName: restaurantLabel,
      status: "pending",
    }).returning();

    res.status(201).json({ ok: true, orderId: order.id, ref: order.ref });

    // Diffusion instantanée aux livreurs connectés
    broadcastOrder({ type: "NEW_ORDER", orderId: order.id, ref: order.ref, source });

    smartDispatch(restaurantLabel, {
      type: "NEW_ORDER",
      title: `🛵 Commande ${source ? `[${source}]` : "externe"} !`,
      body: `${customerName} · ${Number(total)} MAD · ${deliveryAddress}`,
      data: { orderId: order.id, ref: order.ref, url: "/" },
    }).catch(() => {});

    // Notify restaurant via WhatsApp + phone call
    notifyRestaurant(restaurantLabel, {
      ref: order.ref,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.customerAddress,
      items: order.items,
      total: order.total,
      deliveryMode: order.deliveryMode ?? "delivery",
      paymentMethod: order.paymentMethod ?? "cash",
    }).catch(() => {});

  } catch (err) {
    console.error("Inbound webhook error:", err);
    res.status(500).json({ error: "Failed to process inbound order" });
  }
});

router.get("/orders", requireDriverKey, async (req, res) => {
  try {
    const { status, service } = req.query;
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const filtered = orders.filter(o => {
      if (status && o.status !== status) return false;
      if (service && o.service !== service) return false;
      return true;
    });
    res.json({ orders: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// SSE — MUST be before /:id to avoid "stream" being parsed as an id
router.get("/orders/stream", requireDriverKey, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Initial ping to confirm connection
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  // Heartbeat every 25s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n"); } catch (_) { clearInterval(heartbeat); }
  }, 25000);

  addSSEClient(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(res);
  });
});

router.get("/orders/:id", requireDriverKey, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/orders", requireClerkAuth, async (req, res) => {
  try {
    const { ref, service, customerName, customerPhone, customerAddress, items, total, deliveryMode, paymentMethod, restaurantName } = req.body;
    if (!ref || !service || !customerName || !customerPhone || !customerAddress || !items || total === undefined) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }
    // QR payment → hold order until client confirms payment
    const isQR = /qr/i.test(paymentMethod || "");
    const initialStatus = isQR ? "pending_payment" : "pending";

    const [order] = await db.insert(ordersTable).values({
      ref,
      service,
      customerName,
      customerPhone,
      customerAddress,
      items,
      total: Number(total),
      deliveryMode: deliveryMode || "delivery",
      paymentMethod: paymentMethod || "cash",
      restaurantName: restaurantName || null,
      status: initialStatus,
    }).returning();

    res.status(201).json({ order });

    // If QR payment: wait for client confirmation — do NOT dispatch yet
    if (isQR) return;

    // Instant push to all connected driver panels via SSE
    broadcastOrder({ type: "NEW_ORDER", orderId: order.id, ref: order.ref });

    // Smart dispatch: nearby drivers first, then all after 2 min
    smartDispatch(restaurantName, {
      type: "NEW_ORDER",
      title: "🛵 Nouvelle commande !",
      body: `${customerName} · ${Number(total)} MAD${restaurantName ? ` · ${restaurantName}` : ""}`,
      data: {
        orderId: order.id,
        ref: order.ref,
        url: "/",
      },
    }).catch(() => {});

    // Forward to restaurant webhook if configured
    forwardToRestaurant(order).catch(() => {});

    // Notify restaurant via WhatsApp + phone call
    notifyRestaurant(restaurantName, {
      ref: order.ref,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.customerAddress,
      items: order.items,
      total: order.total,
      deliveryMode: order.deliveryMode ?? "delivery",
      paymentMethod: order.paymentMethod ?? "cash",
    }).catch(() => {});

  } catch (err) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

// POST /api/orders/:ref/confirm-payment — client confirms QR payment
// Changes status pending_payment → pending, then dispatches to drivers + restaurant
router.post("/orders/:ref/confirm-payment", requireClerkAuth, async (req, res) => {
  try {
    const ref = String(req.params.ref);
    const [order] = await db
      .update(ordersTable)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(ordersTable.ref, ref))
      .returning();
    if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
    res.json({ ok: true, order });

    // Now dispatch to drivers + restaurant
    broadcastOrder({ type: "NEW_ORDER", orderId: order.id, ref: order.ref });
    smartDispatch(order.restaurantName, {
      type: "NEW_ORDER",
      title: "🛵 Nouvelle commande (paiement confirmé) !",
      body: `${order.customerName} · ${order.total} MAD${order.restaurantName ? ` · ${order.restaurantName}` : ""}`,
      data: { orderId: order.id, ref: order.ref, url: "/" },
    }).catch(() => {});
    forwardToRestaurant(order).catch(() => {});
    notifyRestaurant(order.restaurantName, {
      ref: order.ref,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.customerAddress,
      items: order.items,
      total: order.total,
      deliveryMode: order.deliveryMode ?? "delivery",
      paymentMethod: order.paymentMethod ?? "qr",
    }).catch(() => {});
  } catch (err) {
    req.log.error({ err }, "confirm-payment failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/orders/:id/status", requireDriverKey, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const { status, driverName } = req.body;
    const allowed = ["pending", "preparing", "on_the_way", "delivered", "cancelled", "refused", "accepted", "ready"];
    if (!allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    const [order] = await db
      .update(ordersTable)
      .set({ status, ...(driverName ? { driverName } : {}), updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

// ── Restaurant owner PIN auth ─────────────────────────────────────────────────
const RESTAURANT_PINS: Record<string, string> = {
  "McDonald's Safi":      "1234",
  "Bridge Pizza & Tacos": "2345",
  "Safi Seafood Palace":  "3456",
  "Kebab Express Safi":   "4567",
  "Burger Corner Safi":   "5678",
};

// GET /api/orders/by-restaurant?name=X&pin=Y
router.get("/orders/by-restaurant", async (req, res) => {
  try {
    const name = (req.query.name as string || "").trim();
    const pin  = (req.query.pin  as string || "").trim();
    if (!name) { res.status(400).json({ error: "name required" }); return; }
    const correctPin = RESTAURANT_PINS[name];
    if (!correctPin || pin !== correctPin) { res.status(401).json({ error: "PIN incorrect" }); return; }
    const allOrders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.restaurantName, name))
      .orderBy(desc(ordersTable.createdAt))
      .limit(50);
    // Hide orders awaiting payment confirmation — not yet paid
    const orders = allOrders.filter(o => o.status !== "pending_payment");
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PATCH /api/orders/by-ref/:ref/status — update status by ref (for restaurant owner)
router.patch("/orders/by-ref/:ref/status", async (req, res) => {
  try {
    const ref = String(req.params.ref);
    const { status, pin, restaurantName } = req.body;
    const allowed = ["accepted", "refused", "preparing", "ready", "delivered", "cancelled"];
    if (!allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    // Verify PIN
    const correctPin = restaurantName ? RESTAURANT_PINS[restaurantName] : undefined;
    if (!correctPin || pin !== correctPin) { res.status(401).json({ error: "PIN incorrect" }); return; }
    const { eq: eqFn } = await import("drizzle-orm");
    const [order] = await db
      .update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eqFn(ordersTable.ref, ref))
      .returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

export default router;
