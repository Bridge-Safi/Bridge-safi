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

// POST /api/profile/sync — save name + phone + address + optional avatar, enforce phone uniqueness
router.post("/profile/sync", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }

  const { phone, name, address, avatar } = req.body as {
    phone?: string; name?: string; address?: string; avatar?: string;
  };
  const cleanPhone   = String(phone   || "").trim() || null;
  const cleanName    = String(name    || "").trim() || null;
  const cleanAddress = String(address || "").trim() || null;
  // Accept base64 data URL or HTTPS URL; reject anything else
  const cleanAvatar  = (avatar && (avatar.startsWith("data:image/") || avatar.startsWith("https://")))
    ? avatar : null;

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
    const updateSet: Record<string, unknown> = {
      phone: cleanPhone, name: cleanName, address: cleanAddress, updatedAt: new Date(),
    };
    if (cleanAvatar !== null) updateSet.avatarData = cleanAvatar;

    await db
      .insert(userProfilesTable)
      .values({ userId, phone: cleanPhone, name: cleanName, address: cleanAddress,
                avatarData: cleanAvatar ?? undefined, updatedAt: new Date() })
      .onConflictDoUpdate({ target: userProfilesTable.userId, set: updateSet });
    logger.info({ userId }, "Profile synced");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to sync profile");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/profile — retourne le profil de l'utilisateur connecté (sans avatarData)
router.get("/profile", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  try {
    const rows = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
    if (rows.length === 0) { res.json({ userId, phone: null, name: null }); return; }
    const { avatarData: _, ...rest } = rows[0];
    res.json(rest);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch profile");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/profile/avatar/:userId — serves the stored avatar image (public, no auth needed)
// The game calls this URL to show the player's profile photo.
router.get("/profile/avatar/:targetUserId", async (req, res) => {
  const { targetUserId } = req.params;
  try {
    const rows = await db
      .select({ avatarData: userProfilesTable.avatarData })
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, targetUserId))
      .limit(1);

    const avatarData = rows[0]?.avatarData;
    if (!avatarData) { res.status(404).json({ error: "No avatar" }); return; }

    if (avatarData.startsWith("data:image/")) {
      // Parse base64 data URL and return as image
      const [meta, b64] = avatarData.split(",");
      const mimeMatch = meta.match(/data:([^;]+);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const buf = Buffer.from(b64, "base64");
      res.setHeader("Content-Type", mime);
      res.setHeader("Cache-Control", "public, max-age=300");
      res.setHeader("Content-Length", buf.length);
      res.end(buf);
    } else if (avatarData.startsWith("https://")) {
      // Redirect to the external URL
      res.redirect(302, avatarData);
    } else {
      res.status(404).json({ error: "No avatar" });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to serve avatar");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
