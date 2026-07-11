import { Router, Request, Response, NextFunction } from "express";
import { db, ordersTable, restaurantsTable } from "@workspace/db";
import { eq, desc, sql as sqlRaw } from "drizzle-orm";
import { notifyDrivers, notifySpecificDrivers, notifyDriversExcept, notifyRestaurantOwner } from "./push";
import { getDriverPositions, syncTrackingStatus, getTrackedDriver } from "./tracking";
import { addSSEClient, removeSSEClient, broadcastOrder } from "../lib/sse";
import { logger } from "../lib/logger";
import { notifyRestaurant } from "../lib/notify-restaurant";
import { notifyAdminReport } from "../lib/notify-admin";
import { pool } from "@workspace/db";
import { verifyJWT, normalizePhone } from "./auth";

// ── Auth keys (env vars — ne jamais hardcoder en production) ─────────────────
const DRIVER_KEY           = process.env.DRIVER_KEY           ?? "BRIDGE-DRIVER-2025";
const BRIDGE_INBOUND_SECRET = process.env.BRIDGE_INBOUND_SECRET ?? "bridge-safi-8b269bba03fd8c0205116f3f";

// ── Fix schema drift: colonne "total" en integer au lieu de real ────────────
// Root cause du bug "confirmation de livraison ne marche pas côté Eats et
// Supermarché" : POST /orders renvoyait 500 dès que "total" avait une
// décimale (ex: 42.9 DH), car la vraie colonne Postgres était restée en
// integer alors que le schéma Drizzle déclare "real" depuis longtemps —
// la migration n'avait jamais été appliquée en prod. Résultat : la commande
// n'était JAMAIS enregistrée dans ordersTable, donc la page de suivi client
// ne trouvait jamais le statut "delivered" (elle restait bloquée sur
// "en attente d'un livreur"), même si le livreur avait bien confirmé la
// livraison de son côté. Tabac/Pharmacie/Boulangerie/Souk n'étaient presque
// jamais touchés car leurs totaux tombent souvent sur des DH ronds.
// Idempotent : si la colonne est déjà "real", cette commande ne fait rien.
async function fixOrdersTotalColumnType() {
  try {
    await db.execute(sqlRaw`ALTER TABLE orders ALTER COLUMN total TYPE real USING total::real`);
    logger.info("orders.total column type verified/fixed (real)");
  } catch (err) {
    logger.error({ err }, "Failed to fix orders.total column type");
  }
}
fixOrdersTotalColumnType();

// ── Note chauffeur + signalement de problème ────────────────────────────────
// Ajoute les colonnes nécessaires si elles n'existent pas encore (même
// pattern idempotent que fixOrdersTotalColumnType — voir plus haut).
async function ensureDriverRatingColumns() {
  try {
    await db.execute(sqlRaw`ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_rating REAL`);
    await db.execute(sqlRaw`ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_comment TEXT`);
    await db.execute(sqlRaw`ALTER TABLE orders ADD COLUMN IF NOT EXISTS reported_issue TEXT`);
    await db.execute(sqlRaw`ALTER TABLE orders ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP`);
    // zabi (2026-07-11): le client doit aussi pouvoir noter le RESTAURANT/commerce
    // (comme pour le livreur) — cette note alimente la note affichee sur les
    // cartes (Eats/Pharmacie/Tabac/etc), donc une vraie note qui vient des
    // clients au lieu d'un chiffre fixe hardcode.
    await db.execute(sqlRaw`ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_rating REAL`);
    await db.execute(sqlRaw`ALTER TABLE orders ADD COLUMN IF NOT EXISTS restaurant_comment TEXT`);
    logger.info("orders driver_rating/driver_comment/reported_issue/restaurant_rating columns verified");
  } catch (err) {
    logger.error({ err }, "Failed to ensure driver rating columns");
  }
}
ensureDriverRatingColumns();

/** Middleware — vérifie que le livreur envoie la bonne clé (header ou query) */
function requireDriverKey(req: Request, res: Response, next: NextFunction): void {
  const key = (req.headers["x-driver-key"] as string | undefined)
           ?? (req.query.driverKey as string | undefined);
  if (key !== DRIVER_KEY) {
    res.status(401).json({ error: "Accès non autorisé — clé livreur invalide" });
    return;
  }
  next();
}

/** Middleware — vérifie l'authentification Clerk du client */
function requireClerkAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.auth?.userId ?? null;
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  next();
}

// ── Restaurant coordinates in Safi ───────────────────────────────────────────
// Used for proximity-based smart dispatch (notify nearest drivers first)
const RESTAURANT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Kebab Express Safi":    { lat: 32.3012, lng: -9.2305 },
  "Pizza Safi":            { lat: 32.2980, lng: -9.2350 },
  "Burger House Safi":     { lat: 32.3040, lng: -9.2290 },
  "Restaurant Al Bahr":    { lat: 32.2930, lng: -9.2320 },
  "Café Central Safi":     { lat: 32.2994, lng: -9.2372 },
  // Default Safi centre médina
  "__default__":           { lat: 32.2994, lng: -9.2372 },
};

/** Haversine distance in km between two GPS points. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const NEARBY_KM = 2;       // radius to notify first
const DISPATCH_DELAY = 120_000; // 2 minutes in ms

/**
 * Relaie une commande de livraison (eats / tabac / pharmacie / fleurs) vers le
 * systeme de dispatch des Livreurs, deja filtre : livreurs uniquement, jamais
 * chauffeurs ni moto. Best-effort : n'empeche jamais la creation de la commande.
 */
async function forwardOrderToLivreurs(order: any) {
  const base = process.env.LIVREURS_API_URL;
  if (!base) return;
  const secret = process.env.BRIDGE_WEBHOOK_SECRET;
  try {
    await fetch(`${base}/orders/inbound`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-bridge-secret": secret } : {}),
      },
      body: JSON.stringify({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.customerAddress,
        pickupAddress: order.restaurantName || undefined,
        items: order.items,
        total: order.total,
        paymentMethod: order.paymentMethod ?? "cash",
        notes: order.ref ? `Ref Bridge Eats: ${order.ref}` : undefined,
        source: "bridge-eats",
        serviceType: order.service,
      }),
    });
  } catch (err) {
    logger.error({ err }, "Failed to forward order to Livreurs");
  }
}

/**
 * Transmet au livreur (via Livreurs) le statut resto + le delai de preparation
 * choisi (10/15/20min etc). Le livreur qui a deja accepte la livraison (donc
 * connu de Livreurs via trackingNumber = order.ref, poste directement par
 * chaque page service) recoit un push : "en preparation, pret dans ~Xmin"
 * puis "commande prete, va la recuperer". Best-effort, jamais bloquant.
 */
async function notifyLivreursRestaurantStatus(
  orderRef: string,
  status: "preparing" | "ready",
  estimatedPrepTime?: number | null,
) {
  const base = process.env.LIVREURS_API_URL;
  if (!base) return;
  const secret = process.env.BRIDGE_WEBHOOK_SECRET;
  try {
    await fetch(`${base}/api/deliveries/restaurant-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-bridge-secret": secret } : {}),
      },
      body: JSON.stringify({ trackingNumber: orderRef, status, estimatedPrepTime }),
    });
  } catch (err) {
    logger.warn({ err, orderRef, status }, "notifyLivreursRestaurantStatus: fetch failed");
  }
}

/**
 * Quand le client annule, le dashboard restaurateur (restaurant.safi-bridge.ma)
 * doit aussi voir la commande disparaitre du kanban (elle etait jusqu'ici
 * annulee seulement cote Bridge-safi + Livreurs, jamais cote resto -> le
 * cuisinier continuait a preparer une commande deja annulee).
 */
async function notifyRestaurantDashboardCancel(order: typeof ordersTable.$inferSelect) {
  if (!order.restaurantName) return;
  try {
    const dashboardMatch = await lookupDashboardRestaurant(order.restaurantName);
    if (!dashboardMatch) return; // ancien systeme (webhookUrl manuel) : pas de route cancel, best-effort skip
    const cancelUrl = `${RESTAURANT_DASHBOARD_BASE}/api/webhook/orders/${encodeURIComponent(order.ref)}/cancel`;
    await fetch(cancelUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Bridge-Token": dashboardMatch.token },
    });
  } catch (err) {
    logger.warn({ err, ref: order.ref }, "notifyRestaurantDashboardCancel: fetch failed");
  }
}

/** Smart dispatch: notify nearby drivers first, then ALL remaining after 2 min.
 *
 *  Bug fix: "far" list only included GPS-tracked drivers. Drivers whose position
 *  wasn't yet reported (page not yet open, GPS initializing) were invisible and
 *  never notified. Now after 2 min we notify ALL subscriptions except those
 *  already notified, so no driver is ever skipped.
 */
async function smartDispatch(restaurantName: string | null | undefined, payload: object) {
  const coordKey = (restaurantName && RESTAURANT_COORDS[restaurantName]) ? restaurantName : "__default__";
  const { lat: rLat, lng: rLng } = RESTAURANT_COORDS[coordKey];

  const driverMap = getDriverPositions();
  const nearbyEndpoints: string[] = [];

  for (const [endpoint, loc] of driverMap) {
    const dist = haversineKm(rLat, rLng, loc.lat, loc.lng);
    if (dist <= NEARBY_KM) nearbyEndpoints.push(endpoint);
  }

  if (nearbyEndpoints.length > 0) {
    // Notify nearby drivers immediately
    await notifySpecificDrivers(nearbyEndpoints, payload);
    logger.info({ nearbyCount: nearbyEndpoints.length }, "smart dispatch: nearby drivers notified first");

    // After 2 minutes, notify ALL subscribed drivers EXCEPT those already notified.
    // This catches drivers not yet GPS-tracked (page opening, GPS initializing, etc.)
    const alreadyNotified = new Set(nearbyEndpoints);
    setTimeout(() => {
      notifyDriversExcept(alreadyNotified, payload).catch(() => {});
      logger.info({ excludedCount: alreadyNotified.size }, "smart dispatch: 2-min broadcast sent to remaining drivers");
    }, DISPATCH_DELAY);
  } else {
    // No nearby drivers — notify everyone immediately
    await notifyDrivers(payload);
    logger.info("smart dispatch: no nearby drivers, notified all immediately");
  }
}

const router = Router();

// ── Webhooks par restaurant ─────────────────────────────────────────────────
// Base URL used for callbackUrl — prefer production domain, fallback to Replit domain
function getApiBase(): string {
  const domains = process.env.REPLIT_DOMAINS ?? "";
  const first = domains.split(",")[0]?.trim();
  if (first) return `https://${first}`;
  return "https://safi-bridge.ma";
}

// Domaine du nouveau tableau de bord restaurateurs (self-service, un compte
// par restaurant). Chaque restaurant y a son propre token API, retrouvable
// via /api/restaurant/lookup (secret partagé) — pas besoin de dupliquer le
// token dans la table restaurants de Bridge-safi.
const RESTAURANT_DASHBOARD_BASE = process.env.RESTAURANT_DASHBOARD_BASE ?? "https://restaurant.safi-bridge.ma";
const INTERNAL_LOOKUP_SECRET = process.env.INTERNAL_LOOKUP_SECRET ?? "bridge-safi-internal-lookup-2026";

async function lookupDashboardRestaurant(name: string): Promise<{ webhookUrl: string; token: string } | null> {
  try {
    const resp = await fetch(
      `${RESTAURANT_DASHBOARD_BASE}/api/restaurant/lookup?name=${encodeURIComponent(name)}`,
      { headers: { "X-Internal-Secret": INTERNAL_LOOKUP_SECRET }, signal: AbortSignal.timeout(5000) }
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as { found: boolean; apiToken?: string };
    if (!data.found || !data.apiToken) return null;
    return { webhookUrl: `${RESTAURANT_DASHBOARD_BASE}/api/webhook/orders`, token: data.apiToken };
  } catch (err) {
    logger.warn({ err, name }, "lookupDashboardRestaurant: lookup failed");
    return null;
  }
}

async function forwardToRestaurant(order: typeof ordersTable.$inferSelect) {
  if (!order.restaurantName) {
    logger.info({ ref: order.ref }, "forwardToRestaurant: no restaurantName, skipping");
    return;
  }
  try {
    // 1) Nouveau tableau de bord self-service (prioritaire, un restaurant peut
    //    s'y être inscrit sans qu'aucune configuration manuelle soit faite ici).
    const dashboardMatch = await lookupDashboardRestaurant(order.restaurantName);

    let webhookUrl: string | undefined;
    let token: string | undefined;

    if (dashboardMatch) {
      webhookUrl = dashboardMatch.webhookUrl;
      token = dashboardMatch.token;
    } else {
      // 2) Ancien système (webhookUrl/webhookToken configurés à la main dans
      //    la table restaurants de Bridge-safi elle-même).
      const rows = await db.select().from(restaurantsTable)
        .where(sqlRaw`lower(${restaurantsTable.name}) = lower(${order.restaurantName})`);
      const resto = rows[0];
      if (!resto?.webhookUrl) {
        logger.warn({ ref: order.ref, restaurant: order.restaurantName }, "forwardToRestaurant: no webhookUrl configured (ni tableau de bord, ni config manuelle)");
        return;
      }
      webhookUrl = resto.webhookUrl;
      token = resto.webhookToken ?? BRIDGE_INBOUND_SECRET;
    }

    const callbackUrl = `${getApiBase()}/api/callbacks/order-status`;
    const body = JSON.stringify({
      orderNumber:    order.ref,
      orderId:        order.id,
      customerName:   order.customerName,
      customerPhone:  order.customerPhone,
      deliveryAddress: order.customerAddress,
      items: Array.isArray(order.items)
        ? (order.items as {name:string;qty?:number;quantity?:number;price:number}[])
            .map(it => ({ name: it.name, quantity: it.quantity ?? it.qty ?? 1, price: it.price }))
        : order.items,
      totalAmount:    order.total,
      deliveryMode:   order.deliveryMode,
      paymentMethod:  order.paymentMethod,
      callbackUrl,
    });
    logger.info({ ref: order.ref, restaurant: order.restaurantName, webhookUrl }, "Sending webhook to restaurant...");
    const resp = await fetch(webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Bridge-Token": token! },
      body,
    });
    const respText = await resp.text().catch(() => "");
    logger.info({ ref: order.ref, restaurant: order.restaurantName, status: resp.status, body: respText }, "Restaurant webhook response");
  } catch (err) {
    logger.error({ err, ref: order.ref, restaurant: order.restaurantName }, "forwardToRestaurant: fetch failed");
  }
}

// ── Miroir vers Manager (tableau de bord / commandes) ───────────────────────
// Bridge-safi a sa propre base de commandes ; Manager (manager.safi-bridge.ma)
// en a une séparée pour le dashboard. Sans ce forward, Manager ne voit JAMAIS
// les vraies commandes clients (seulement celles créées manuellement dedans).
const MANAGER_SERVICE_TYPE_MAP: Record<string, string> = {
  delivery: "nourriture",
  tabac: "tabac",
  pharmacie: "pharmacie",
  fleurs: "fleurs",
  souk: "souk",
  boulangerie: "boulangerie",
  supermarche: "supermarche",
  taxi: "taxi",
  confort: "confort",
};
async function forwardToManager(order: typeof ordersTable.$inferSelect) {
  try {
    const resp = await fetch("https://manager.safi-bridge.ma/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: order.ref,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.customerAddress,
        items: JSON.stringify(order.items ?? []),
        totalAmount: Number(order.total),
        serviceType: MANAGER_SERVICE_TYPE_MAP[order.service] ?? "nourriture",
        platform: order.restaurantName ?? "Bridge Eats",
        notes: `${order.deliveryMode ?? "delivery"} \u00b7 ${order.paymentMethod ?? "cash"}`,
      }),
    });
    if (!resp.ok) {
      logger.warn({ ref: order.ref, status: resp.status }, "forwardToManager: non-OK response");
    }
  } catch (err) {
    logger.error({ err, ref: order.ref }, "forwardToManager: fetch failed");
  }
}

// ── Callback entrant depuis restaurant.safi-bridge.ma ───────────────────────
// POST /api/callbacks/order-status
// Reçu quand le restaurateur change le statut d'une commande
router.post("/callbacks/order-status", async (req, res) => {
  try {
    const { orderId, orderNumber, status, estimatedPrepTime, rejectionReason } = req.body as {
      orderId?: number;
      orderNumber?: string;
      status?: string;
      estimatedPrepTime?: number;
      rejectionReason?: string | null;
    };

    const allowed = ["accepted", "ready", "rejected", "preparing", "delivered", "cancelled"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: "Statut invalide" }); return;
    }
    if (!orderNumber && !orderId) {
      res.status(400).json({ error: "orderNumber ou orderId requis" }); return;
    }

    // Map "rejected" → "refused" for internal consistency
    const internalStatus = status === "rejected" ? "refused" : status;

    let updated;
    if (orderNumber) {
      [updated] = await db.update(ordersTable)
        .set({ status: internalStatus, updatedAt: new Date() })
        .where(eq(ordersTable.ref, orderNumber))
        .returning();
    } else {
      const { eq: eqFn } = await import("drizzle-orm");
      [updated] = await db.update(ordersTable)
        .set({ status: internalStatus, updatedAt: new Date() })
        .where(eqFn(ordersTable.id, orderId!))
        .returning();
    }

    if (!updated) { res.status(404).json({ error: "Commande introuvable" }); return; }

    logger.info({
      ref: updated.ref,
      status: internalStatus,
      estimatedPrepTime,
      rejectionReason,
    }, "Order status updated via restaurant callback");

    res.json({ ok: true, ref: updated.ref, status: internalStatus });

    // Sync in-memory tracking store → customer sees the change in real-time
    const trackMap: Record<string, string> = {
      accepted:  "preparing",
      preparing: "preparing",
      ready:     "preparing",
      on_the_way:"on_way",
      delivered: "delivered",
    };
    if (trackMap[internalStatus]) {
      syncTrackingStatus(updated.ref, trackMap[internalStatus]);
    }

    // Transmet au livreur assigne (via Livreurs) le delai de preparation choisi
    // par le resto, puis un push "commande prete" — zabi: "le livreur doit
    // recevoir le delai sur quoi le restaurant a appuye" + "une notification
    // pour le livreur que la commande est prete".
    if (internalStatus === "preparing" || internalStatus === "ready") {
      notifyLivreursRestaurantStatus(updated.ref, internalStatus, estimatedPrepTime ?? null)
        .catch(() => {});
    }
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ── Webhook entrant partenaire (ex: Bridge Eats) ────────────────────────────
router.post("/orders/inbound", async (req, res) => {
  try {
    const secret = req.headers["x-bridge-secret"];
    if (secret !== BRIDGE_INBOUND_SECRET) {
      res.status(401).json({ error: "Unauthorized — invalid secret" }); return;
    }

    const {
      customerName,
      customerPhone,
      deliveryAddress,
      pickupAddress,
      items,
      total,
      source,
      paymentMethod,
    } = req.body;

    if (!customerName || !customerPhone || !deliveryAddress || !items || total === undefined) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }

    const ref = `EXT-${Math.floor(1000 + Math.random() * 9000)}`;
    const restaurantLabel = pickupAddress
      ? `${pickupAddress}${source ? ` (${source})` : ""}`
      : source || "Partenaire externe";

    const [order] = await db.insert(ordersTable).values({
      ref,
      service: "delivery",
      customerName,
      customerPhone: normalizePhone(customerPhone),
      customerAddress: deliveryAddress,
      items,
      total: Number(total),
      deliveryMode: "delivery",
      paymentMethod: paymentMethod || "cash",
      restaurantName: restaurantLabel,
      status: "pending",
    }).returning();

    res.status(201).json({ ok: true, orderId: order.id, ref: order.ref });

    // 1️⃣ Notify restaurant via WhatsApp + phone call EN PREMIER
    notifyRestaurant(restaurantLabel, {
      ref: order.ref,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.customerAddress,
      items: order.items,
      total: order.total,
      deliveryMode: order.deliveryMode ?? "delivery",
      paymentMethod: order.paymentMethod ?? "cash",
    }).catch(() => {});

    // 2️⃣ Ensuite diffusion aux livreurs
    broadcastOrder({ type: "NEW_ORDER", orderId: order.id, ref: order.ref, source });

    smartDispatch(restaurantLabel, {
      type: "NEW_ORDER",
      title: `🛵 Commande ${source ? `[${source}]` : "externe"} !`,
      body: `${customerName} · ${Number(total)} MAD · ${deliveryAddress}`,
      data: { orderId: order.id, ref: order.ref, url: "/" },
    }).catch(() => {});

  } catch (err) {
    console.error("Inbound webhook error:", err);
    res.status(500).json({ error: "Failed to process inbound order" });
  }
});

// ── Public status endpoint — customer polls their own order (no auth needed) ─
router.get("/orders/status/:ref", async (req, res) => {
  try {
    const ref = String(req.params.ref);
    const [order] = await db.select({
      ref: ordersTable.ref,
      status: ordersTable.status,
      updatedAt: ordersTable.updatedAt,
      createdAt: ordersTable.createdAt,
      service: ordersTable.service,
      driverRating: ordersTable.driverRating,
      restaurantRating: ordersTable.restaurantRating,
      // Champs ajoutes (2026-07-10) pour le recu imprimable a l'ecran
      // "livraison terminee" — pas de donnee sensible (le client consulte
      // uniquement sa propre commande via son ref, pas le telephone).
      total: ordersTable.total,
      restaurantName: ordersTable.restaurantName,
      customerAddress: ordersTable.customerAddress,
      customerName: ordersTable.customerName,
      items: ordersTable.items,
      paymentMethod: ordersTable.paymentMethod,
    }).from(ordersTable).where(eq(ordersTable.ref, ref));
    if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
    res.json({
      ref: order.ref, status: order.status, updatedAt: order.updatedAt, service: order.service,
      alreadyRated: order.driverRating != null,
      alreadyRatedRestaurant: order.restaurantRating != null,
      createdAt: order.createdAt, total: order.total, restaurantName: order.restaurantName,
      customerAddress: order.customerAddress, customerName: order.customerName,
      items: order.items, paymentMethod: order.paymentMethod,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ── Note moyenne des commerces (restaurant/tabac/pharmacie/etc), calculee a
// partir des vraies notes clients (restaurant_rating sur orders) ────────────
// Public, en lecture seule. Utilise par les cartes cote client (Eats en
// premier lieu, puis Pharmacie/Tabac/Fleurs/Boulangerie/Souk) pour afficher
// une vraie note au lieu d'un chiffre fixe. zabi (2026-07-11): "cette note
// cest celle qui apparaitra dans la note du restaurant dans eats ou
// pharmacie ou tabac etc pour que les client voient la note".
// GET /api/restaurants/ratings?names=Resto%20A,Resto%20B  -> { "Resto A": {avg, count}, ... }
router.get("/restaurants/ratings", async (req, res) => {
  try {
    const namesParam = String(req.query.names ?? "");
    const names = namesParam.split(",").map(n => n.trim()).filter(Boolean).slice(0, 200);
    if (names.length === 0) { res.json({}); return; }

    const result = await pool.query(
      `SELECT restaurant_name AS name, AVG(restaurant_rating)::float AS avg, COUNT(*)::int AS count
       FROM orders
       WHERE restaurant_rating IS NOT NULL AND restaurant_name = ANY($1::text[])
       GROUP BY restaurant_name`,
      [names]
    );

    const out: Record<string, { avg: number; count: number }> = {};
    for (const row of result.rows as { name: string; avg: number; count: number }[]) {
      out[row.name] = { avg: Math.round(row.avg * 10) / 10, count: row.count };
    }
    res.json(out);
  } catch (err) {
    logger.error({ err }, "Failed to fetch restaurant ratings");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ── Note / commentaire livreur + signalement d'un problème (client) ─────────
// Public (comme /orders/status/:ref) : le client note son propre livreur
// après livraison, en option laisse un commentaire, et/ou signale un souci
// (colis manquant, retard, comportement...) même sans mettre de note.
router.post("/orders/:ref/rating", async (req, res) => {
  try {
    const ref = String(req.params.ref);
    const { stars, comment, reportReason, restaurantStars, restaurantComment } = req.body ?? {};

    if (stars !== undefined && stars !== null) {
      const n = Number(stars);
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        res.status(400).json({ error: "La note doit être entre 1 et 5" });
        return;
      }
    }
    if (restaurantStars !== undefined && restaurantStars !== null) {
      const n = Number(restaurantStars);
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        res.status(400).json({ error: "La note du commerce doit être entre 1 et 5" });
        return;
      }
    }
    if (stars == null && restaurantStars == null && !reportReason) {
      res.status(400).json({ error: "Merci de donner une note ou de signaler un problème" });
      return;
    }

    const [order] = await db.select({ id: ordersTable.id, customerName: ordersTable.customerName }).from(ordersTable).where(eq(ordersTable.ref, ref));
    if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (stars != null) patch.driverRating = Number(stars);
    if (typeof comment === "string" && comment.trim()) patch.driverComment = comment.trim().slice(0, 500);
    // zabi (2026-07-11): note + commentaire client sur le RESTAURANT/commerce,
    // meme principe que la note livreur ci-dessus — alimente la note affichee
    // sur les cartes (Eats/Pharmacie/Tabac/etc) via /api/restaurants/ratings.
    if (restaurantStars != null) patch.restaurantRating = Number(restaurantStars);
    if (typeof restaurantComment === "string" && restaurantComment.trim()) patch.restaurantComment = restaurantComment.trim().slice(0, 500);
    if (typeof reportReason === "string" && reportReason.trim()) {
      patch.reportedIssue = reportReason.trim().slice(0, 500);
      patch.reportedAt = new Date();
    }

    await db.update(ordersTable).set(patch).where(eq(ordersTable.ref, ref));
    logger.info({ ref, stars, restaurantStars, reported: !!reportReason }, "Order rating/report saved");
    res.json({ ok: true });

    // Route vers les 2 destinations séparées, en best-effort (ne bloque
    // jamais la réponse client) :
    // - la note + le commentaire montent chez le LIVREUR (visibles sur son
    //   propre profil dans l'app Livreurs) ;
    // - le signalement d'un problème part vers MANAGER (flux d'activité du
    //   dashboard admin), jamais vers le livreur.
    if (stars != null) {
      fetch(`https://livreur.safi-bridge.ma/api/tracking/${ref}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars: Number(stars), comment: typeof comment === "string" ? comment : undefined }),
      }).catch((err) => logger.warn({ err, ref }, "Failed to forward review to Livreurs"));
    }
    if (typeof reportReason === "string" && reportReason.trim()) {
      fetch(`https://manager.safi-bridge.ma/api/orders/by-number/${ref}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason.trim().slice(0, 500) }),
      }).catch((err) => logger.warn({ err, ref }, "Failed to forward report to Manager"));

      // Alerte WhatsApp directe a zabi (2026-07-10, demande zabi) — EN PLUS du
      // flux Manager ci-dessus, ne le remplace pas. Nom/photo du livreur tires
      // du tracking store en temps reel (pas de la DB, plus a jour).
      const trackedDriver = getTrackedDriver(ref);
      notifyAdminReport({
        ref,
        reason: reportReason.trim().slice(0, 500),
        customerName: order.customerName ?? undefined,
        driverName: trackedDriver?.name,
        driverPhoto: trackedDriver?.photo,
        driverPhone: trackedDriver?.phone,
      }).catch((err) => logger.warn({ err, ref }, "Failed to send admin WhatsApp report alert"));
    }
  } catch (err) {
    logger.error({ err }, "Failed to save order rating");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ── Annuler une commande (client) ───────────────────────────────────────────
// Public (même modèle que /orders/status/:ref) : le client annule sa propre
// commande via sa référence. Autorisé UNIQUEMENT avant que le restaurant ne
// commence la préparation — dès que le statut passe à "preparing", la
// nourriture/les produits sont déjà engagés en cuisine, donc l'annulation
// devient impossible et doit passer par le support (bouton Aide).
const CANCELABLE_STATUSES = ["pending", "pending_payment", "accepted"];
router.post("/orders/:ref/cancel", async (req, res) => {
  try {
    const ref = String(req.params.ref);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.ref, ref));
    if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
    if (!CANCELABLE_STATUSES.includes(order.status)) {
      res.status(409).json({ error: "Cette commande ne peut plus être annulée — le livreur est déjà en route." });
      return;
    }
    await db.update(ordersTable).set({ status: "cancelled", updatedAt: new Date() }).where(eq(ordersTable.ref, ref));
    logger.info({ ref }, "Order cancelled by customer");
    try { broadcastOrder({ type: "ORDER_CANCELLED", orderId: order.id, ref: order.ref }); } catch {}
    res.json({ ok: true });

    // Notifie Livreurs : la commande disparaît de la liste du livreur (0dh,
    // pas de calcul de trajet) + push "Commande annulée" au livreur assigné
    // s'il y en avait déjà un. Best-effort, ne bloque jamais la réponse client.
    fetch(`https://livreur.safi-bridge.ma/api/tracking/${ref}/cancel`, { method: "POST" })
      .catch((err) => logger.warn({ err, ref }, "Failed to notify Livreurs of cancellation"));

    // Notifie aussi le dashboard restaurateur : la commande annulée par le
    // client doit disparaître du kanban resto (sinon le cuisinier continue à
    // préparer une commande déjà annulée). zabi: "quand le client annule la
    // livraison sa doit etre annulez meme dans restaurant".
    notifyRestaurantDashboardCancel(order).catch(() => {});
  } catch (err) {
    logger.error({ err }, "Failed to cancel order");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ── Historique / suivi du compte connecté ("Suivre mes commandes") ─────────
// Bug corrigé : l'historique client était stocké uniquement en localStorage
// (clé "bridge_history"), donc partagé par TOUT appareil/navigateur, quel
// que soit le client réellement connecté (plusieurs clients sur le même
// téléphone/PC voyaient les commandes des uns et des autres). Cette route
// retourne désormais l'historique réel, propre à chaque compte, en filtrant
// les commandes par le numéro de téléphone associé au compte authentifié.
router.get("/orders/mine", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return; }
    const payload = verifyJWT(authHeader.slice(7));
    if (!payload?.sub) { res.status(401).json({ error: "Token invalide ou expiré" }); return; }

    const userResult = await pool.query("SELECT phone FROM users WHERE id = $1", [payload.sub]);
    const phone = userResult.rows[0]?.phone as string | null | undefined;
    if (!phone) { res.json({ orders: [] }); return; }

    const normalized = normalizePhone(phone);
    // Compare on the last 9 digits (Moroccan national number, sans indicatif)
    // pour retrouver aussi les commandes passées avant ce correctif, quand
    // customerPhone n'était pas encore normalisé à l'écriture (espaces,
    // "06...", "+212...", "00212..." mélangés).
    const last9 = normalized.replace(/\D/g, "").slice(-9);
    const orders = await db.select({
      ref: ordersTable.ref,
      service: ordersTable.service,
      status: ordersTable.status,
      total: ordersTable.total,
      restaurantName: ordersTable.restaurantName,
      customerAddress: ordersTable.customerAddress,
      createdAt: ordersTable.createdAt,
    }).from(ordersTable)
      .where(sqlRaw`regexp_replace(${ordersTable.customerPhone}, '\D', '', 'g') LIKE ${'%' + last9}`)
      .orderBy(desc(ordersTable.createdAt))
      .limit(1000); // 2026-07-10: releve de 100 -> 1000 (zabi: l'historique doit rester affiche "toute la vie")

    res.json({ orders });
  } catch (err) {
    logger.error({ err }, "Failed to fetch account order history");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/orders", requireDriverKey, async (req, res) => {
  try {
    const { status, service } = req.query;
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const filtered = orders.filter(o => {
      if (status && o.status !== status) return false;
      if (service && o.service !== service) return false;
      return true;
    });
    res.json({ orders: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// SSE — MUST be before /:id to avoid "stream" being parsed as an id
router.get("/orders/stream", requireDriverKey, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Initial ping to confirm connection
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  // Heartbeat every 25s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(": ping\n\n"); } catch (_) { clearInterval(heartbeat); }
  }, 25000);

  addSSEClient(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(res);
  });
});

router.get("/orders/:id", requireDriverKey, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { ref, service, customerName, customerPhone, customerAddress, items, total, deliveryMode, paymentMethod, restaurantName } = req.body;
    if (!ref || !service || !customerName || !customerPhone || !customerAddress || !items || total === undefined) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }
    // QR payment → hold order until client confirms payment
    const isQR = /qr/i.test(paymentMethod || "");
    const initialStatus = isQR ? "pending_payment" : "pending";

    const [order] = await db.insert(ordersTable).values({
      ref,
      service,
      customerName,
      customerPhone: normalizePhone(customerPhone),
      customerAddress,
      items,
      total: Number(total),
      deliveryMode: deliveryMode || "delivery",
      paymentMethod: paymentMethod || "cash",
      restaurantName: restaurantName || null,
      status: initialStatus,
    }).returning();

    res.status(201).json({ order });

    // If QR payment: wait for client confirmation — do NOT dispatch yet
    if (isQR) return;

    // 1️⃣ Notify restaurant owner FIRST via push (before drivers)
    if (restaurantName) {
      notifyRestaurantOwner(restaurantName, {
        type: "NEW_ORDER",
        title: "🔔 Nouvelle commande !",
        body: `${customerName} · ${Number(total)} MAD`,
        data: { orderId: order.id, ref: order.ref, url: "/resto" },
      }).catch(() => {});
    }

    // 2️⃣ Forward to restaurant webhook BEFORE driver dispatch
    //    POST https://restaurant.safi-bridge.ma/api/webhook/orders
    //    Header: X-Bridge-Token: <restaurant token>
    await forwardToRestaurant(order).catch(() => {});
    forwardToManager(order).catch(() => {});

    // 3️⃣ Dispatch aux livreurs SEULEMENT si livraison (pas click & collect / retrait)
    const isCollect = order.deliveryMode === "collect" || order.deliveryMode === "retrait";
    if (!isCollect) {
      broadcastOrder({ type: "NEW_ORDER", orderId: order.id, ref: order.ref });

      // 4️⃣ Smart dispatch: nearby drivers first, then all after 2 min
      smartDispatch(restaurantName, {
        type: "NEW_ORDER",
        title: "🛵 Nouvelle commande !",
        body: `${customerName} · ${Number(total)} MAD${restaurantName ? ` · ${restaurantName}` : ""}`,
        data: {
          orderId: order.id,
          ref: order.ref,
          url: "/",
        },
      }).catch(() => {});
      // ⚠️ forwardOrderToLivreurs() DÉSACTIVÉ : chaque page de service (Eats,
      // Tabac, Pharmacie, Fleurs, Boulangerie, Souk) poste déjà DIRECTEMENT
      // sa propre commande à Livreurs (DRIVER_APP_URL/api/deliveries) avec
      // trackingNumber = order.ref — c'est cette commande-là qui a le bon
      // suivi/GPS. Ce forward créait une DEUXIÈME commande fantôme avec un
      // trackingNumber différent (donc jamais suivie côté client), et pour
      // Boulangerie/Souk elle atterrissait mal étiquetée "Bridge Eats" côté
      // Livreurs (serviceType non reconnu -> fallback "eats").
      // forwardOrderToLivreurs(order).catch(() => {});
    }

    // Notify restaurant via WhatsApp + phone call
    notifyRestaurant(restaurantName, {
      ref: order.ref,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.customerAddress,
      items: order.items,
      total: order.total,
      deliveryMode: order.deliveryMode ?? "delivery",
      paymentMethod: order.paymentMethod ?? "cash",
    }).catch(() => {});

  } catch (err) {
    logger.error({ err }, "Failed to create order");
    res.status(500).json({ error: "Failed to create order" });
  }
});

// POST /api/orders/:ref/confirm-payment — client confirms QR payment
// Changes status pending_payment → pending, then dispatches to drivers + restaurant
router.post("/orders/:ref/confirm-payment", requireClerkAuth, async (req, res) => {
  try {
    const ref = String(req.params.ref);
    const [order] = await db
      .update(ordersTable)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(ordersTable.ref, ref))
      .returning();
    if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
    res.json({ ok: true, order });

    // 1️⃣ Restaurant reçoit la commande EN PREMIER (webhook + WhatsApp)
    await forwardToRestaurant(order).catch(() => {});
    forwardToManager(order).catch(() => {});
    notifyRestaurant(order.restaurantName, {
      ref: order.ref,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.customerAddress,
      items: order.items,
      total: order.total,
      deliveryMode: order.deliveryMode ?? "delivery",
      paymentMethod: order.paymentMethod ?? "qr",
    }).catch(() => {});

    // 2️⃣ Dispatch aux livreurs SEULEMENT si livraison (pas click & collect / retrait)
    const isCollect = order.deliveryMode === "collect" || order.deliveryMode === "retrait";
    if (!isCollect) {
      broadcastOrder({ type: "NEW_ORDER", orderId: order.id, ref: order.ref });
      smartDispatch(order.restaurantName, {
        type: "NEW_ORDER",
        title: "🛵 Nouvelle commande (paiement confirmé) !",
        body: `${order.customerName} · ${order.total} MAD${order.restaurantName ? ` · ${order.restaurantName}` : ""}`,
        data: { orderId: order.id, ref: order.ref, url: "/" },
      }).catch(() => {});
    }
  } catch (err) {
    req.log.error({ err }, "confirm-payment failed");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.patch("/orders/:id/status", requireDriverKey, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const { status, driverName } = req.body;
    const allowed = ["pending", "preparing", "on_the_way", "delivered", "cancelled", "refused", "accepted", "ready"];
    if (!allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    const [order] = await db
      .update(ordersTable)
      .set({ status, ...(driverName ? { driverName } : {}), updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ order });

    // Sync tracking store → customer voit EN CHEMIN dès que livreur part
    const trackMap: Record<string, string> = {
      accepted:   "preparing",
      preparing:  "preparing",
      ready:      "preparing",
      on_the_way: "on_way",
      delivered:  "delivered",
    };
    if (trackMap[status]) {
      syncTrackingStatus(order.ref, trackMap[status]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

// ── Restaurant owner PIN auth ─────────────────────────────────────────────────
const RESTAURANT_PINS: Record<string, string> = {
  "McDonald's Safi":      "1234",
  "Bridge Pizza & Tacos": "2345",
  "Safi Seafood Palace":  "3456",
  "Kebab Express Safi":   "4567",
  "Burger Corner Safi":   "5678",
};

// GET /api/orders/by-restaurant?name=X&pin=Y  (also accepts Clerk Bearer token)
router.get("/orders/by-restaurant", async (req, res) => {
  try {
    let resolvedName: string | null = null;

    // Try Clerk auth first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const payload = await verifyToken(authHeader.slice(7), { secretKey: process.env.CLERK_SECRET_KEY! });
        const rows = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerId, payload.sub));
        if (rows.length > 0) resolvedName = rows[0].name;
      } catch { /* fall through to PIN */ }
    }

    if (!resolvedName) {
      const name = (req.query.name as string || "").trim();
      const pin  = (req.query.pin  as string || "").trim();
      if (!name) { res.status(400).json({ error: "name required" }); return; }
      const correctPin = RESTAURANT_PINS[name];
      if (!correctPin || pin !== correctPin) { res.status(401).json({ error: "PIN incorrect" }); return; }
      resolvedName = name;
    }

    const allOrders = await db
      .select()
      .from(ordersTable)
      .where(sqlRaw`lower(${ordersTable.restaurantName}) = lower(${resolvedName})`)
      .orderBy(desc(ordersTable.createdAt))
      .limit(50);
    const orders = allOrders.filter(o => o.status !== "pending_payment");
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PATCH /api/orders/by-ref/:ref/status — update status by ref (for restaurant owner)
router.patch("/orders/by-ref/:ref/status", async (req, res) => {
  try {
    const ref = String(req.params.ref);
    const { status, pin, restaurantName } = req.body;
    const allowed = ["accepted", "refused", "preparing", "ready", "delivered", "cancelled"];
    if (!allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

    // Accept Clerk Bearer OR PIN
    const authHeader = req.headers.authorization;
    let authorized = false;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        await verifyToken(authHeader.slice(7), { secretKey: process.env.CLERK_SECRET_KEY! });
        authorized = true;
      } catch { /* fall through */ }
    }
    if (!authorized) {
      const correctPin = restaurantName ? RESTAURANT_PINS[restaurantName] : undefined;
      if (!correctPin || pin !== correctPin) { res.status(401).json({ error: "PIN incorrect" }); return; }
    }
    const { eq: eqFn } = await import("drizzle-orm");
    const [order] = await db
      .update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eqFn(ordersTable.ref, ref))
      .returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ order });

    // Sync in-memory tracking store → customer TrackingPage updates in real-time
    const trackMap: Record<string, string> = {
      accepted:  "preparing",
      preparing: "preparing",
      ready:     "preparing",
      on_the_way:"on_way",
      delivered: "delivered",
    };
    if (trackMap[status]) {
      syncTrackingStatus(order.ref, trackMap[status]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// ── Store owner routes (Tabac, Pharmacie, Fleurs) ─────────────────────────────
const STORE_CODES: Record<string, string> = {
  tabac:     process.env.TABAC_OWNER_CODE     || "TABAC-2025",
  pharmacie: process.env.PHARMACIE_OWNER_CODE || "PHARMA-2025",
  fleurs:    process.env.FLEURS_OWNER_CODE    || "FLEURS-2025",
};

// GET /api/orders/by-store?type=tabac&code=TABAC-2025
router.get("/orders/by-store", async (req, res) => {
  try {
    const type = (req.query.type as string || "").toLowerCase().trim();
    const code = (req.query.code as string || "").trim();
    if (!type || !STORE_CODES[type]) {
      res.status(400).json({ error: "type requis: tabac|pharmacie|fleurs" });
      return;
    }
    if (code !== STORE_CODES[type]) {
      res.status(401).json({ error: "Code incorrect" });
      return;
    }
    const storeService = type; // 'tabac' | 'pharmacie' | 'fleurs'
    const nameKeyword = type === "tabac" ? "Bridge Tabac" : type === "pharmacie" ? "Bridge Pharmacie" : "Bridge Fleurs";

    const allOrders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(200);

    const filtered = allOrders.filter(o => {
      const matchService = o.service === storeService;
      const matchName = o.restaurantName ? o.restaurantName.toLowerCase().includes(nameKeyword.toLowerCase().split(" ")[1]) : false;
      return (matchService || matchName) && o.status !== "pending_payment";
    }).slice(0, 50);

    res.json({ orders: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PATCH /api/orders/by-ref/:ref/store-status — update status from store owner
router.patch("/orders/by-ref/:ref/store-status", async (req, res) => {
  try {
    const ref = String(req.params.ref);
    const { status, type, code } = req.body as { status: string; type: string; code: string };
    const allowed = ["accepted", "preparing", "ready", "delivered", "cancelled"];
    if (!allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }
    if (!type || !STORE_CODES[type]) { res.status(400).json({ error: "type requis" }); return; }
    if (code !== STORE_CODES[type]) { res.status(401).json({ error: "Code incorrect" }); return; }

    const { eq: eqFn } = await import("drizzle-orm");
    const [order] = await db
      .update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eqFn(ordersTable.ref, ref))
      .returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }

    const trackMap: Record<string, string> = {
      accepted: "preparing", preparing: "preparing", ready: "preparing",
      on_the_way: "on_way", delivered: "delivered",
    };
    if (trackMap[status]) syncTrackingStatus(order.ref, trackMap[status]);

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

export default router;
