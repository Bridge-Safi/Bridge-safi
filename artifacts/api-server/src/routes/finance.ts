import { Router, type IRouter } from "express";

// ── BT Finance : répartition réelle des revenus ─────────────────────────────
// Modèle confirmé par zabi (2026-07-18) :
//   - Articles (menus, prix Glovo ajustés : Pharmacie +7%, Fleurs -7%) -> RESTAURATEURS/commerçants
//   - Frais de service 6,5 DH / commande -> BRIDGE
//   - Frais de livraison 12 DH = 6 DH LIVREUR (fixe, toutes distances) + 6 DH BRIDGE
//   - Surcharge km silencieuse (1 DH/km) -> BRIDGE
// Net Bridge ≈ 12,5 DH / commande livrée (hors km). Part restaurateurs = CA - 18,5 × N.
// Source des chiffres : Manager (base des commandes tous services).

const LIVREUR_PAR_COURSE = Number(process.env.LIVREUR_PAY_MAD ?? 6);
const SERVICE_FEE = Number(process.env.BRIDGE_SERVICE_FEE_MAD ?? 6.5);
const PART_LIVRAISON_BRIDGE = Number(process.env.BRIDGE_DELIVERY_SHARE_MAD ?? 6);
// Commission Bridge sur les ARTICLES (prix bases Glovo) : 6% pour Bridge,
// 94% reverses au restaurateur (zabi 2026-07-19).
const COMMISSION_ARTICLES = Number(process.env.BRIDGE_COMMISSION_PCT ?? 6) / 100;

const router: IRouter = Router();

router.get("/finance/summary", async (_req, res) => {
  try {
    const r = await fetch("https://manager.safi-bridge.ma/api/dashboard/summary", {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) { res.status(502).json({ error: "Manager injoignable" }); return; }
    const s = (await r.json()) as {
      totalRevenue?: number; todayRevenue?: number;
      deliveredOrders?: number; todayDelivered?: number; todayOrders?: number; totalOrders?: number;
    };

    const split = (encaisse: number, commandes: number) => {
      const livreurs = commandes * LIVREUR_PAR_COURSE;
      const fraisBridge = commandes * (SERVICE_FEE + PART_LIVRAISON_BRIDGE);
      const articles = Math.max(0, encaisse - livreurs - fraisBridge);
      const commissionArticles = articles * COMMISSION_ARTICLES;
      const restaurateurs = articles - commissionArticles;
      const bridge = fraisBridge + commissionArticles;
      return { encaisse, commandes, articles, bridge, commissionArticles, livreurs, restaurateurs };
    };

    res.json({
      jour: split(s.todayRevenue ?? 0, s.todayDelivered ?? 0),
      global: split(s.totalRevenue ?? 0, s.deliveredOrders ?? 0),
      commandesJour: s.todayOrders ?? 0,
      commandesTotal: s.totalOrders ?? 0,
      params: {
        livreurParCourse: LIVREUR_PAR_COURSE,
        fraisService: SERVICE_FEE,
        partLivraisonBridge: PART_LIVRAISON_BRIDGE,
        netBridgeParCommande: SERVICE_FEE + PART_LIVRAISON_BRIDGE,
        commissionArticlesPct: COMMISSION_ARTICLES * 100,
      },
    });
  } catch {
    res.status(502).json({ error: "Manager injoignable" });
  }
});

// GET /finance/staff — livreurs réels + paie du mois (proxy Manager, évite le CORS)
router.get("/finance/staff", async (_req, res) => {
  try {
    const r = await fetch("https://manager.safi-bridge.ma/api/dashboard/payroll", {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) { res.status(502).json({ error: "Manager injoignable" }); return; }
    res.json(await r.json());
  } catch {
    res.status(502).json({ error: "Manager injoignable" });
  }
});

export default router;
