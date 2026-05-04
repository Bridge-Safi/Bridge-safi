import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, userProfilesTable } from "@workspace/db";
import { eq, ne, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// GET /api/profile/check-phone?phone=X
router.get("/profile/check-phone", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  const phone = String(req.query.phone || "").trim();
  if (!phone) { res.json({ taken: false }); return; }
  try {
    const rows = await db
      .select()
      .from(userProfilesTable)
      .where(and(eq(userProfilesTable.phone, phone), ne(userProfilesTable.userId, userId)))
      .limit(1);
    res.json({ taken: rows.length > 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to check phone uniqueness");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/profile/sync — save name + phone, enforce phone uniqueness
router.post("/profile/sync", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }

  const { phone, name } = req.body as { phone?: string; name?: string };
  const cleanPhone = String(phone || "").trim() || null;
  const cleanName  = String(name  || "").trim() || null;

  if (cleanPhone) {
    const conflict = await db
      .select()
      .from(userProfilesTable)
      .where(and(eq(userProfilesTable.phone, cleanPhone), ne(userProfilesTable.userId, userId)))
      .limit(1)
      .catch(() => []);
    if (conflict.length > 0) {
      res.status(409).json({ error: "phone_taken" });
      return;
    }
  }

  try {
    await db
      .insert(userProfilesTable)
      .values({ userId, phone: cleanPhone, name: cleanName, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userProfilesTable.userId,
        set: { phone: cleanPhone, name: cleanName, updatedAt: new Date() },
      });
    logger.info({ userId }, "Profile synced");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to sync profile");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/profile — retourne le profil de l'utilisateur connecté
router.get("/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  try {
    const rows = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
    if (rows.length === 0) { res.json({ userId, phone: null, name: null }); return; }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch profile");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
