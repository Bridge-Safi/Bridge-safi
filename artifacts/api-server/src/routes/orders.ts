import { Router } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { notifyDrivers, notifySpecificDrivers } from "./push";
import { getDriverPositions } from "./tracking";
import { addSSEClient, removeSSEClient, broadcastOrder } from "../lib/sse";
import { logger } from "../lib/logger";

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

/** Smart dispatch: notify nearby drivers first, then all after 2 min. */
async function smartDispatch(restaurantName: string | null | undefined, payload: object) {
  const coordKey = (restaurantName && RESTAURANT_COORDS[restaurantName]) ? restaurantName : "__default__";
  const { lat: rLat, lng: rLng } = RESTAURANT_COORDS[coordKey];

  const driverMap = getDriverPositions();
  const nearbyEndpoints: string[] = [];
  const farEndpoints: string[] = [];

  for (const [endpoint, loc] of driverMap) {
    const dist = haversineKm(rLat, rLng, loc.lat, loc.lng);
    if (dist <= NEARBY_KM) nearbyEndpoints.push(endpoint);
    else farEndpoints.push(endpoint);
  }

  if (nearbyEndpoints.length > 0) {
    // Notify nearby drivers immediately
    await notifySpecificDrivers(nearbyEndpoints, payload);
    logger.info({ nearbyCount: nearbyEndpoints.length, farCount: farEndpoints.length }, "smart dispatch: nearby drivers notified");
    // After 2 minutes, notify far drivers
    setTimeout(() => {
      notifySpecificDrivers(farEndpoints, payload).catch(() => {});
    }, DISPATCH_DELAY);
  } else {
    // No nearby drivers — notify everyone immediately
    await notifyDrivers(payload);
    logger.info("smart dispatch: no nearby drivers, notified all");
  }
}

const router = Router();

const BRIDGE_SECRET = "bridge-safi-8b269bba03fd8c0205116f3f";

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
      headers: { "Content-Type": "application/json", "x-bridge-secret": BRIDGE_SECRET },
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

// ── Webhook entrant partenaire (ex: Grado Eats) ─────────────────────────────
router.post("/orders/inbound", async (req, res) => {
  try {
    const secret = req.headers["x-bridge-secret"];
    if (secret !== BRIDGE_SECRET) {
      return res.status(401).json({ error: "Unauthorized — invalid secret" });
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
      return res.status(400).json({ error: "Missing required fields" });
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

  } catch (err) {
    console.error("Inbound webhook error:", err);
    res.status(500).json({ error: "Failed to process inbound order" });
  }
});

router.get("/orders", async (req, res) => {
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
router.get("/orders/stream", (req, res) => {
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

router.get("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { ref, service, customerName, customerPhone, customerAddress, items, total, deliveryMode, paymentMethod, restaurantName } = req.body;
    if (!ref || !service || !customerName || !customerPhone || !customerAddress || !items || total === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }
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
      status: "pending",
    }).returning();

    res.status(201).json({ order });

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

  } catch (err) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const { status, driverName } = req.body;
    const allowed = ["pending", "preparing", "on_the_way", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const [order] = await db
      .update(ordersTable)
      .set({ status, ...(driverName ? { driverName } : {}), updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
