import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, gameDiamondsTable, missionsTable, missionCompletionsTable } from "@workspace/db";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// Daily diamond cap per user from missions (15 DH = 3000 diamonds)
const DAILY_MISSION_CAP = 3000;

// ── Seed default missions if table is empty ──────────────────────────────────
async function seedMissionsIfEmpty() {
  const existing = await db.select({ c: count() }).from(missionsTable);
  if ((existing[0]?.c ?? 0) > 0) return;
  await db.insert(missionsTable).values([
    { type: 'video',     title: '🎬 Pub vidéo courte (30s)',         description: 'Regarde une publicité de 30 secondes',                           rewardDiamonds: 600,    dailyLimit: 5,  durationSeconds: 30,  sortOrder: 1,  active: true },
    { type: 'video',     title: '🎬 Pub vidéo longue (60s)',          description: 'Regarde une publicité de 60 secondes pour plus de diamants',      rewardDiamonds: 1000,   dailyLimit: 3,  durationSeconds: 60,  sortOrder: 2,  active: true },
    { type: 'social',    title: '📸 Suivre Bridge sur Instagram',     description: 'Suis la page officielle Bridge Safi sur Instagram',               rewardDiamonds: 300,    dailyLimit: 1,  externalUrl: 'https://instagram.com/bridgesafi', sortOrder: 3, active: true },
    { type: 'social',    title: '📺 S\'abonner à Bridge YouTube',     description: 'Abonne-toi à la chaîne YouTube de Bridge Safi',                   rewardDiamonds: 400,    dailyLimit: 1,  externalUrl: 'https://youtube.com/@bridgesafi',  sortOrder: 4, active: true },
    { type: 'social',    title: '👍 Rejoindre Bridge Facebook',       description: 'Rejoins et aime la page Facebook de Bridge Safi',                 rewardDiamonds: 200,    dailyLimit: 1,  externalUrl: 'https://facebook.com/bridgesafi',  sortOrder: 5, active: true },
    { type: 'offerwall', title: '📱 Télécharger un jeu partenaire',   description: 'Télécharge et atteins le niveau 5 d\'un jeu partenaire — 15 DH offerts !', rewardDiamonds: 20000, dailyLimit: 1, sortOrder: 6, active: true },
    { type: 'survey',    title: '📊 Sondage rapide (2-3 min)',        description: 'Réponds à un sondage pour gagner le maximum de diamants',          rewardDiamonds: 2400,   dailyLimit: 1,  sortOrder: 7, active: true },
    { type: 'fortune',   title: '🎡 Roue de la fortune',              description: 'Tente ta chance à la roue — regarde une pub et gagne des diamants',rewardDiamonds: 6,      dailyLimit: 10, durationSeconds: 15,  sortOrder: 8, active: true },
  ]);
  logger.info("Missions seeded");
}
seedMissionsIfEmpty().catch(err => logger.error({ err }, "Failed to seed missions"));

// GET /api/missions — list all active missions + today completions for user
router.get("/missions", async (req, res) => {
  const { userId } = getAuth(req);
  try {
    const missions = await db
      .select()
      .from(missionsTable)
      .where(eq(missionsTable.active, true))
      .orderBy(missionsTable.sortOrder);

    if (!userId) {
      res.json({ missions, completions: [], todayDiamonds: 0, dailyCap: DAILY_MISSION_CAP });
      return;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const completions = await db
      .select()
      .from(missionCompletionsTable)
      .where(
        and(
          eq(missionCompletionsTable.userId, userId),
          gte(missionCompletionsTable.completedAt, startOfDay),
        )
      );

    const todayDiamonds = completions.reduce((s, c) => s + c.diamondsAwarded, 0);

    res.json({ missions, completions, todayDiamonds, dailyCap: DAILY_MISSION_CAP });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch missions");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/missions/:id/complete — complete a mission and earn diamonds
router.post("/missions/:id/complete", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Connexion requise pour gagner des diamants" }); return; }

  const missionId = parseInt(req.params.id, 10);
  if (isNaN(missionId)) { res.status(400).json({ error: "Mission invalide" }); return; }

  try {
    // Load mission
    const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, missionId)).limit(1);
    if (!mission || !mission.active) { res.status(404).json({ error: "Mission introuvable" }); return; }

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    // Check daily completions for this mission
    const todayForMission = await db
      .select({ c: count() })
      .from(missionCompletionsTable)
      .where(and(
        eq(missionCompletionsTable.userId, userId),
        eq(missionCompletionsTable.missionId, missionId),
        gte(missionCompletionsTable.completedAt, startOfDay),
      ));
    const missionCount = todayForMission[0]?.c ?? 0;
    if (mission.dailyLimit !== -1 && missionCount >= mission.dailyLimit) {
      res.status(429).json({ error: "Limite journalière atteinte pour cette mission" }); return;
    }

    // Check global daily cap
    const todayTotal = await db
      .select({ total: sql<number>`COALESCE(SUM(${missionCompletionsTable.diamondsAwarded}), 0)` })
      .from(missionCompletionsTable)
      .where(and(
        eq(missionCompletionsTable.userId, userId),
        gte(missionCompletionsTable.completedAt, startOfDay),
      ));
    const earned = Number(todayTotal[0]?.total ?? 0);
    if (earned >= DAILY_MISSION_CAP) {
      res.status(429).json({ error: "Plafond journalier de 15 DH atteint — revenez demain !", todayDiamonds: earned }); return;
    }

    // Cap award to remaining daily allowance
    const remaining = DAILY_MISSION_CAP - earned;
    const awarded = Math.min(mission.rewardDiamonds, remaining);

    // Record completion
    await db.insert(missionCompletionsTable).values({ userId, missionId, diamondsAwarded: awarded });

    // Credit diamonds to user account
    await db
      .insert(gameDiamondsTable)
      .values({ userId, diamonds: awarded, totalEarned: awarded, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: gameDiamondsTable.userId,
        set: {
          diamonds: sql`${gameDiamondsTable.diamonds} + ${awarded}`,
          totalEarned: sql`${gameDiamondsTable.totalEarned} + ${awarded}`,
          updatedAt: new Date(),
        },
      });

    const newBalance = await db.select({ d: gameDiamondsTable.diamonds }).from(gameDiamondsTable).where(eq(gameDiamondsTable.userId, userId)).limit(1);
    logger.info({ userId, missionId, awarded }, "Mission completed");
    res.json({ awarded, newBalance: newBalance[0]?.d ?? 0, todayDiamonds: earned + awarded });
  } catch (err) {
    req.log.error({ err }, "Failed to complete mission");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/missions/earnings — today's stats
router.get("/missions/earnings", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Non authentifié" }); return; }
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${missionCompletionsTable.diamondsAwarded}), 0)`, completions: count() })
      .from(missionCompletionsTable)
      .where(and(eq(missionCompletionsTable.userId, userId), gte(missionCompletionsTable.completedAt, startOfDay)));
    const balance = await db.select({ d: gameDiamondsTable.diamonds }).from(gameDiamondsTable).where(eq(gameDiamondsTable.userId, userId)).limit(1);
    res.json({
      todayDiamonds: Number(result[0]?.total ?? 0),
      todayCompletions: result[0]?.completions ?? 0,
      totalBalance: balance[0]?.d ?? 0,
      dailyCap: DAILY_MISSION_CAP,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch earnings");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
