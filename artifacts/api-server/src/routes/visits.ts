import { Router } from "express";
import { db, siteVisitsTable } from "@workspace/db";
import { sql, gte, countDistinct, count } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();
const DRIVER_KEY = process.env.DRIVER_KEY ?? "BRIDGE-DRIVER-2025";

function checkAdmin(adminKey: unknown): boolean {
  return typeof adminKey === "string" && adminKey === DRIVER_KEY;
}

/** POST /api/visits/track — record a visit */
router.post("/visits/track", async (req, res) => {
  const { sessionId, path, referrer } = req.body ?? {};
  if (!sessionId || typeof sessionId !== "string") {
    res.status(400).json({ error: "sessionId required" });
    return;
  }
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.socket.remoteAddress
      || null;
    await db.insert(siteVisitsTable).values({
      sessionId: sessionId.slice(0, 64),
      path: typeof path === "string" ? path.slice(0, 256) : null,
      referrer: typeof referrer === "string" ? referrer.slice(0, 256) : null,
      userAgent: (req.headers["user-agent"] || "").toString().slice(0, 256) || null,
      ip,
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "track visit error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** GET /api/admin/stats?adminKey=... — visitor stats */
router.get("/admin/stats", async (req, res) => {
  if (!checkAdmin(req.query.adminKey)) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  try {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(dayStart.getTime() - 6 * 86400000);
    const monthStart = new Date(dayStart.getTime() - 29 * 86400000);

    const [totals] = await db.select({
      totalViews: count(),
      uniqueVisitors: countDistinct(siteVisitsTable.sessionId),
    }).from(siteVisitsTable);

    const [today] = await db.select({
      views: count(),
      uniques: countDistinct(siteVisitsTable.sessionId),
    }).from(siteVisitsTable).where(gte(siteVisitsTable.createdAt, dayStart));

    const [week] = await db.select({
      views: count(),
      uniques: countDistinct(siteVisitsTable.sessionId),
    }).from(siteVisitsTable).where(gte(siteVisitsTable.createdAt, weekStart));

    const [month] = await db.select({
      views: count(),
      uniques: countDistinct(siteVisitsTable.sessionId),
    }).from(siteVisitsTable).where(gte(siteVisitsTable.createdAt, monthStart));

    // Last 7 days breakdown
    const dailyRows = await db.execute(sql`
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(*)::int AS views,
        COUNT(DISTINCT session_id)::int AS uniques
      FROM site_visits
      WHERE created_at >= ${weekStart}
      GROUP BY 1
      ORDER BY 1 DESC
    `);

    res.json({
      total: totals,
      today,
      week,
      month,
      daily: dailyRows.rows,
    });
  } catch (err) {
    logger.error({ err }, "stats error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
