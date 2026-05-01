import { Router } from "express";
import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT } from "../lib/vapid";

webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const router = Router();

router.get("/push/vapid-key", (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post("/push/subscribe", async (req, res) => {
  try {
    const { endpoint, keys, driverName } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: "Missing subscription fields" });
    }
    await db
      .insert(pushSubscriptionsTable)
      .values({ endpoint, p256dh: keys.p256dh, auth: keys.auth, driverName: driverName || null })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: { p256dh: keys.p256dh, auth: keys.auth, driverName: driverName || null },
      });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

router.delete("/push/subscribe", async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

export async function notifyDrivers(payload: object) {
  try {
    const subs = await db.select().from(pushSubscriptionsTable);
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
      )
    );
    const failed = results.filter(r => r.status === "rejected").length;
    if (failed > 0) {
      const deadEndpoints = subs
        .filter((_, i) => results[i].status === "rejected")
        .map(s => s.endpoint);
      await Promise.allSettled(
        deadEndpoints.map(ep =>
          db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, ep))
        )
      );
    }
  } catch (_) {}
}

/** Send push notification to ALL drivers EXCEPT the given endpoints (already notified). */
export async function notifyDriversExcept(exclude: Set<string>, payload: object) {
  try {
    const subs = await db.select().from(pushSubscriptionsTable);
    const targets = subs.filter(s => !exclude.has(s.endpoint));
    if (targets.length === 0) return;
    const results = await Promise.allSettled(
      targets.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
      )
    );
    const deadEndpoints = targets
      .filter((_, i) => results[i].status === "rejected")
      .map(s => s.endpoint);
    if (deadEndpoints.length > 0) {
      await Promise.allSettled(
        deadEndpoints.map(ep =>
          db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, ep))
        )
      );
    }
  } catch (_) {}
}

/** Send push notification only to specific driver endpoints. */
export async function notifySpecificDrivers(endpoints: string[], payload: object) {
  if (endpoints.length === 0) return;
  try {
    const subs = await db.select().from(pushSubscriptionsTable);
    const targets = subs.filter(s => endpoints.includes(s.endpoint));
    const results = await Promise.allSettled(
      targets.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
      )
    );
    const deadEndpoints = targets
      .filter((_, i) => results[i].status === "rejected")
      .map(s => s.endpoint);
    if (deadEndpoints.length > 0) {
      await Promise.allSettled(
        deadEndpoints.map(ep =>
          db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, ep))
        )
      );
    }
  } catch (_) {}
}

export default router;
