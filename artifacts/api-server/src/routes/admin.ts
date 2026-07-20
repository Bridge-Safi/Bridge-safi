import { Router } from "express";
import { logger } from "../lib/logger";
import { db, ordersTable } from "@workspace/db";
import { desc, notInArray, eq } from "drizzle-orm";

const router = Router();

const DRIVER_KEY = process.env.DRIVER_KEY ?? "BRIDGE-DRIVER-2025";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY ?? "";
const APP_DOMAIN = "https://safi-bridge.ma";

/** POST /api/admin/sign-in-link
 *  Body: { email: string, adminKey: string }
 *  Returns: { url: string } — lien de connexion direct valable 1h
 */
router.post("/admin/sign-in-link", async (req, res) => {
  const { email, adminKey } = req.body ?? {};

  if (adminKey !== DRIVER_KEY) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email requis." });
    return;
  }

  try {
    // 1. Find the user by email
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email.trim())}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET}` } }
    );
    const users = (await searchRes.json()) as any[];

    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: `Aucun compte trouvé pour ${email}.` });
      return;
    }

    const userId = users[0].id;

    // 2. Generate a sign-in token (valid 1h)
    const tokenRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLERK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, expires_in_seconds: 3600 }),
    });
    const tokenData: any = await tokenRes.json();

    if (!tokenData.token) {
      res.status(500).json({ error: "Impossible de générer le token Clerk." });
      return;
    }

    // 3. Build the link pointing to the app's sign-in page
    const url = `${APP_DOMAIN}/sign-in?__clerk_ticket=${tokenData.token}`;

    req.log.info({ userId, email }, "Admin sign-in link generated");
    res.json({ url, expiresIn: "1 heure" });
  } catch (err) {
    logger.error({ err }, "Admin sign-in link error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** POST /api/admin/ban-user
 *  Body: { email: string, adminKey: string }
 *  Bans the user — they can no longer sign in or re-register with this email.
 */
router.post("/admin/ban-user", async (req, res) => {
  const { email, adminKey } = req.body ?? {};

  if (adminKey !== DRIVER_KEY) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email requis." });
    return;
  }

  try {
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email.trim())}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET}` } }
    );
    const users = (await searchRes.json()) as any[];

    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: `Aucun compte trouvé pour ${email}.` });
      return;
    }

    const userId = users[0].id;

    const banRes = await fetch(`https://api.clerk.com/v1/users/${userId}/ban`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    });

    if (!banRes.ok) {
      const errData = await banRes.text();
      req.log.error({ errData, userId }, "Clerk ban failed");
      res.status(500).json({ error: "Bannissement échoué." });
      return;
    }

    req.log.info({ userId, email }, "User banned by admin");
    res.json({ ok: true, message: `${email} a été banni définitivement.` });
  } catch (err) {
    logger.error({ err }, "Admin ban error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** POST /api/admin/unban-user
 *  Body: { email: string, adminKey: string }
 */
router.post("/admin/unban-user", async (req, res) => {
  const { email, adminKey } = req.body ?? {};

  if (adminKey !== DRIVER_KEY) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email requis." });
    return;
  }

  try {
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email.trim())}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET}` } }
    );
    const users = (await searchRes.json()) as any[];

    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: `Aucun compte trouvé pour ${email}.` });
      return;
    }

    const userId = users[0].id;
    const r = await fetch(`https://api.clerk.com/v1/users/${userId}/unban`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    });

    if (!r.ok) {
      res.status(500).json({ error: "Débannissement échoué." });
      return;
    }

    req.log.info({ userId, email }, "User unbanned by admin");
    res.json({ ok: true, message: `${email} a été débanni.` });
  } catch (err) {
    logger.error({ err }, "Admin unban error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** POST /api/admin/delete-user
 *  Body: { email: string, adminKey: string }
 *  Removes the account entirely — user can re-register with the same email.
 */
router.post("/admin/delete-user", async (req, res) => {
  const { email, adminKey } = req.body ?? {};

  if (adminKey !== DRIVER_KEY) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email requis." });
    return;
  }

  try {
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email.trim())}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET}` } }
    );
    const users = (await searchRes.json()) as any[];

    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: `Aucun compte trouvé pour ${email}.` });
      return;
    }

    const userId = users[0].id;
    const r = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${CLERK_SECRET}` },
    });

    if (!r.ok) {
      res.status(500).json({ error: "Suppression échouée." });
      return;
    }

    req.log.info({ userId, email }, "User deleted by admin");
    res.json({ ok: true, message: `${email} a été supprimé. Il peut se réinscrire.` });
  } catch (err) {
    logger.error({ err }, "Admin delete error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ── GET /api/admin/orders?adminKey=... — toutes les commandes actives ─────────
// N'inclut PAS les commandes delivered/cancelled/refused (déjà terminées).
router.get("/admin/orders", async (req, res) => {
  const adminKey = (req.query.adminKey as string | undefined) ?? "";
  if (adminKey !== DRIVER_KEY) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(notInArray(ordersTable.status, ["delivered", "cancelled", "refused"]))
      .orderBy(desc(ordersTable.createdAt));
    res.json({ orders });
  } catch (err) {
    logger.error({ err }, "Admin orders fetch error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ── PATCH /api/admin/orders/:ref/assign — assigner un livreur à une commande ──
router.patch("/admin/orders/:ref/assign", async (req, res) => {
  const { adminKey, driverName } = req.body ?? {};
  if (adminKey !== DRIVER_KEY) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  const { ref } = req.params;
  if (!driverName || typeof driverName !== "string") {
    res.status(400).json({ error: "Nom du livreur requis." });
    return;
  }
  try {
    const [order] = await db
      .update(ordersTable)
      .set({ driverName: driverName.trim(), updatedAt: new Date() })
      .where(eq(ordersTable.ref, ref))
      .returning();
    if (!order) { res.status(404).json({ error: "Commande introuvable." }); return; }
    logger.info({ ref, driverName }, "Admin assigned driver to order");
    res.json({ ok: true, order });
  } catch (err) {
    logger.error({ err }, "Admin assign driver error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
