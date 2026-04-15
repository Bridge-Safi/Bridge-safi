import { Router } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { notifyDrivers } from "./push";
import { addSSEClient, removeSSEClient, broadcastOrder } from "../lib/sse";

const router = Router();

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

    // Push notification to phones (for locked screens)
    notifyDrivers({
      type: "NEW_ORDER",
      title: "🛵 Nouvelle commande !",
      body: `${customerName} · ${Number(total)} MAD${restaurantName ? ` · ${restaurantName}` : ""}`,
      data: {
        orderId: order.id,
        ref: order.ref,
        url: "/",
      },
    }).catch(() => {});

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
