import { Router } from "express";
import { db, couponsTable, couponRedemptionsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();
const DRIVER_KEY = process.env.DRIVER_KEY ?? "BRIDGE-DRIVER-2025";

function checkAdmin(adminKey: unknown): boolean {
  return typeof adminKey === "string" && adminKey === DRIVER_KEY;
}

/** GET /api/admin/coupons?adminKey=... — list all coupons */
router.get("/admin/coupons", async (req, res) => {
  if (!checkAdmin(req.query.adminKey)) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  try {
    const rows = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
    res.json({ coupons: rows });
  } catch (err) {
    logger.error({ err }, "List coupons error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** POST /api/admin/coupons — create a coupon
 *  Body: { adminKey, code, discountType: 'percent'|'fixed', discountValue, maxUses?, expiresAt?, note? }
 */
router.post("/admin/coupons", async (req, res) => {
  const { adminKey, code, discountType, discountValue, maxUses, expiresAt, note } = req.body ?? {};
  if (!checkAdmin(adminKey)) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Code requis." });
    return;
  }
  if (discountType !== "percent" && discountType !== "fixed") {
    res.status(400).json({ error: "Type de réduction invalide (percent ou fixed)." });
    return;
  }
  const value = Number(discountValue);
  if (!Number.isFinite(value) || value <= 0) {
    res.status(400).json({ error: "Valeur de réduction invalide." });
    return;
  }
  if (discountType === "percent" && value > 100) {
    res.status(400).json({ error: "Pourcentage maximum: 100." });
    return;
  }

  const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "");
  try {
    await db.insert(couponsTable).values({
      code: normalizedCode,
      discountType,
      discountValue: Math.round(value),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      note: note || null,
      active: true,
    });
    req.log.info({ code: normalizedCode }, "Coupon created");
    res.json({ ok: true, message: `Code ${normalizedCode} créé.` });
  } catch (err: any) {
    if (String(err?.message || "").includes("duplicate")) {
      res.status(409).json({ error: `Le code ${normalizedCode} existe déjà.` });
      return;
    }
    logger.error({ err }, "Create coupon error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** DELETE /api/admin/coupons/:code?adminKey=... */
router.delete("/admin/coupons/:code", async (req, res) => {
  if (!checkAdmin(req.query.adminKey)) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  try {
    await db.delete(couponsTable).where(eq(couponsTable.code, req.params.code.toUpperCase()));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Delete coupon error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** POST /api/admin/coupons/:code/toggle — activate/deactivate */
router.post("/admin/coupons/:code/toggle", async (req, res) => {
  if (!checkAdmin(req.body?.adminKey)) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  try {
    const code = req.params.code.toUpperCase();
    const [existing] = await db.select().from(couponsTable).where(eq(couponsTable.code, code)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Code introuvable." });
      return;
    }
    await db.update(couponsTable).set({ active: !existing.active }).where(eq(couponsTable.code, code));
    res.json({ ok: true, active: !existing.active });
  } catch (err) {
    logger.error({ err }, "Toggle coupon error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** POST /api/coupons/validate — public (used by client at checkout)
 *  Body: { code, subtotal? }
 *  Returns: { valid, discountType, discountValue, discountAmount, message }
 */
router.post("/coupons/validate", async (req, res) => {
  const { code, subtotal } = req.body ?? {};
  if (!code || typeof code !== "string") {
    res.status(400).json({ valid: false, error: "Code requis." });
    return;
  }
  try {
    const normalizedCode = code.trim().toUpperCase();
    const [c] = await db.select().from(couponsTable).where(eq(couponsTable.code, normalizedCode)).limit(1);
    if (!c) {
      res.json({ valid: false, error: "Code inconnu." });
      return;
    }
    if (!c.active) {
      res.json({ valid: false, error: "Code désactivé." });
      return;
    }
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) {
      res.json({ valid: false, error: "Code expiré." });
      return;
    }
    if (c.maxUses && c.usedCount >= c.maxUses) {
      res.json({ valid: false, error: "Code épuisé." });
      return;
    }
    const sub = Number(subtotal) || 0;
    const discountAmount =
      c.discountType === "percent"
        ? Math.round((sub * c.discountValue) / 100 * 100) / 100
        : c.discountValue;
    res.json({
      valid: true,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      discountAmount: Math.min(discountAmount, sub),
      message: c.discountType === "percent"
        ? `-${c.discountValue}% appliqué`
        : `-${c.discountValue} DH appliqué`,
    });
  } catch (err) {
    logger.error({ err }, "Validate coupon error");
    res.status(500).json({ valid: false, error: "Erreur serveur." });
  }
});

/** POST /api/coupons/redeem — record a redemption (called when an order is placed)
 *  Body: { code, userId, orderRef? }
 */
router.post("/coupons/redeem", async (req, res) => {
  const { code, userId, orderRef } = req.body ?? {};
  if (!code || !userId) {
    res.status(400).json({ error: "code et userId requis." });
    return;
  }
  try {
    const normalizedCode = String(code).trim().toUpperCase();
    const [c] = await db.select().from(couponsTable).where(eq(couponsTable.code, normalizedCode)).limit(1);
    if (!c || !c.active) {
      res.status(400).json({ error: "Code invalide." });
      return;
    }
    await db.insert(couponRedemptionsTable).values({
      code: normalizedCode,
      userId: String(userId),
      orderRef: orderRef ? String(orderRef) : null,
    });
    await db.update(couponsTable)
      .set({ usedCount: sql`${couponsTable.usedCount} + 1` })
      .where(eq(couponsTable.code, normalizedCode));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Redeem coupon error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
