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
router.get("/manager/leaderboard", async (_req, res) => {
  try {
    const r = await fetch(`${MANAGER_URL}/api/players`);
    if (!r.ok) { res.status(502).json({ error: "Manager indisponible" }); return; }
    const players = (await r.json()) as ManagerPlayer[];
    const sorted = [...players].sort((a, b) => (b.diamonds || 0) - (a.diamonds || 0));
    res.json({ players: sorted, total: sorted.length });
  } catch (err) {
    logger.error({ err }, "Failed to fetch manager leaderboard");
    res.status(500).json({ error: "Erreur serveur" });
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
