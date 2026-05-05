import { Router } from "express";
import { randomUUID } from "crypto";
import { getAuth } from "@clerk/express";
import { db, gameDiamondsTable, userProfilesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

// ── Tokens de jeu à usage unique (validité 10 min) ──────────────────────────
interface GameToken { userId: string; phone: string; name: string; expiresAt: number; }
const gameTokens = new Map<string, GameToken>();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of gameTokens) if (v.expiresAt < now) gameTokens.delete(k);
}, 60_000);

const router = Router();

// POST /api/game/token — génère un token sécurisé avec le vrai numéro du compte
// Le jeu externe appelle /api/game/verify-token pour valider le numéro
router.post("/game/token", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  try {
    const rows = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);
    const phone = rows[0]?.phone ?? null;
    const name = rows[0]?.name ?? '';
    if (!phone) {
      res.status(400).json({ error: "no_phone", message: "Aucun numéro enregistré sur ce compte" });
      return;
    }
    const token = randomUUID();
    gameTokens.set(token, { userId, phone, name, expiresAt: Date.now() + 30 * 60_000 });
    logger.info({ userId }, "Game token generated");
    res.json({ token, phone, name });
  } catch (err) {
    req.log.error({ err }, "Failed to generate game token");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/game/verify-token?token=XXX — appelé par le jeu externe pour vérifier le numéro
// Retourne le userId + phone si le token est valide (CORS ouvert pour le domaine du jeu)
router.get("/game/verify-token", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const token = String(req.query.token ?? "").trim();
  if (!token) { res.status(400).json({ error: "Token manquant" }); return; }
  const data = gameTokens.get(token);
  if (!data || data.expiresAt < Date.now()) {
    res.status(401).json({ error: "Token invalide ou expiré" });
    return;
  }
  res.json({ valid: true, userId: data.userId, phone: data.phone });
});

// POST /api/game/diamonds/by-token — appelé par le jeu externe (pas de session Clerk)
// Auth via le token de jeu signé. CORS ouvert pour bridge-safi.replit.app
router.options("/game/diamonds/by-token", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});
router.post("/game/diamonds/by-token", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { token, diamonds } = req.body as { token?: string; diamonds?: number };
  if (!token) { res.status(400).json({ error: "Token manquant" }); return; }
  if (typeof diamonds !== "number" || diamonds < 0 || !Number.isInteger(diamonds)) {
    res.status(400).json({ error: "diamonds doit être un entier positif" }); return;
  }
  const data = gameTokens.get(token);
  if (!data || data.expiresAt < Date.now()) {
    res.status(401).json({ error: "Token invalide ou expiré" }); return;
  }
  try {
    const rows = await db
      .insert(gameDiamondsTable)
      .values({ userId: data.userId, diamonds, totalEarned: diamonds, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: gameDiamondsTable.userId,
        set: {
          diamonds: sql`GREATEST(${gameDiamondsTable.diamonds}, ${diamonds})`,
          totalEarned: sql`${gameDiamondsTable.totalEarned} + GREATEST(0, ${diamonds} - ${gameDiamondsTable.diamonds})`,
          updatedAt: new Date(),
        },
      })
      .returning();
    logger.info({ userId: data.userId, diamonds }, "Game diamonds synced via token");
    res.json({ diamonds: rows[0]?.diamonds ?? diamonds });
  } catch (err) {
    req.log.error({ err }, "Failed to save game diamonds by token");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/game/diamonds — returns current diamond count for authenticated user
router.get("/game/diamonds", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(gameDiamondsTable)
      .where(eq(gameDiamondsTable.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      res.json({ userId, diamonds: 0, totalEarned: 0 });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch game diamonds");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/game/diamonds — upsert diamond count for authenticated user
router.post("/game/diamonds", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const { diamonds } = req.body as { diamonds?: number };
  if (typeof diamonds !== "number" || diamonds < 0 || !Number.isInteger(diamonds)) {
    res.status(400).json({ error: "diamonds must be a non-negative integer" });
    return;
  }

  try {
    const rows = await db
      .insert(gameDiamondsTable)
      .values({
        userId,
        diamonds,
        totalEarned: diamonds,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: gameDiamondsTable.userId,
        set: {
          diamonds: sql`GREATEST(${gameDiamondsTable.diamonds}, ${diamonds})`,
          totalEarned: sql`${gameDiamondsTable.totalEarned} + GREATEST(0, ${diamonds} - ${gameDiamondsTable.diamonds})`,
          updatedAt: new Date(),
        },
      })
      .returning();

    logger.info({ userId, diamonds }, "Game diamonds updated");
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to update game diamonds");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/game/diamonds/spend — deduct diamonds spent at checkout
router.post("/game/diamonds/spend", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const { spend } = req.body as { spend?: number };
  if (typeof spend !== "number" || spend <= 0 || !Number.isInteger(spend)) {
    res.status(400).json({ error: "spend must be a positive integer" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(gameDiamondsTable)
      .where(eq(gameDiamondsTable.userId, userId))
      .limit(1);

    const current = rows[0]?.diamonds ?? 0;
    if (current < spend) {
      res.status(400).json({ error: "Solde insuffisant", current });
      return;
    }

    const updated = await db
      .update(gameDiamondsTable)
      .set({
        diamonds: sql`${gameDiamondsTable.diamonds} - ${spend}`,
        updatedAt: new Date(),
      })
      .where(eq(gameDiamondsTable.userId, userId))
      .returning();

    logger.info({ userId, spend, remaining: updated[0]?.diamonds }, "Diamonds spent at checkout");
    res.json({ diamonds: updated[0]?.diamonds ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to spend game diamonds");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
