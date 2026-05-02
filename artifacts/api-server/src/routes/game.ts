import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, gameDiamondsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

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
