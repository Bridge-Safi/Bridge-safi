import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();
const MANAGER_URL = "https://order-dispatcher.replit.app";

interface ManagerPlayer {
  id: number;
  pseudo: string;
  phone: string;
  diamonds: number;
  score: number;
  gamesPlayed: number;
  menuCost: number;
  missing: number;
  amountMAD: number;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /api/manager/leaderboard — proxy Manager players sorted by diamonds desc
router.get("/manager/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT gd.user_id AS "userId", gd.diamonds, gd.total_earned AS "totalEarned",
             COALESCE(u.name, up.name, 'Joueur') AS name,
             COALESCE(u.phone, up.phone) AS phone
      FROM game_diamonds gd
      LEFT JOIN users u ON u.id = gd.user_id
      LEFT JOIN user_profiles up ON up.user_id = gd.user_id
      ORDER BY gd.diamonds DESC LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur classement" });
  }
});

// POST /api/manager/sync — sync a player's diamonds to Manager by phone (fire-and-forget helper)
router.post("/manager/sync", async (req, res) => {
  try {
    const { phone, pseudo, diamonds } = req.body as { phone?: string; pseudo?: string; diamonds?: number };
    if (!phone || typeof diamonds !== "number") {
      res.status(400).json({ error: "phone et diamonds requis" }); return;
    }

    const listResp = await fetch(`${MANAGER_URL}/api/players`);
    if (!listResp.ok) { res.status(502).json({ error: "Manager indisponible" }); return; }
    const players = (await listResp.json()) as ManagerPlayer[];
    const existing = players.find(p => p.phone === phone);

    if (existing) {
      if (diamonds > (existing.diamonds || 0)) {
        const patchResp = await fetch(`${MANAGER_URL}/api/players/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diamonds }),
        });
        const updated = await patchResp.json();
        res.json({ action: "updated", player: updated });
      } else {
        res.json({ action: "no_change", player: existing });
      }
    } else {
      const createResp = await fetch(`${MANAGER_URL}/api/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pseudo: pseudo || phone, diamonds }),
      });
      const created = await createResp.json();
      res.json({ action: "created", player: created });
    }
  } catch (err) {
    logger.error({ err }, "Failed to sync player to Manager");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export { MANAGER_URL };
export default router;
