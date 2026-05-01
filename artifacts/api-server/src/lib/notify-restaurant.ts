/**
 * ══════════════════════════════════════════════════════════════
 *  Bridge Safi — Notification automatique des restaurateurs
 *
 *  Quand une commande arrive :
 *    1. Message WhatsApp avec les détails de la commande
 *    2. Appel vocal automatique (si call: true) pour les alerter
 *
 *  Requiert les variables d'environnement :
 *    TWILIO_ACCOUNT_SID
 *    TWILIO_AUTH_TOKEN
 *    TWILIO_PHONE_NUMBER  (ex: "+12025551234" ou "whatsapp:+14155238886")
 * ══════════════════════════════════════════════════════════════
 */

import { logger } from "./logger";
import { RESTAURANT_CONTACTS } from "./restaurant-contacts";

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM  = process.env.TWILIO_PHONE_NUMBER;

const twilioReady = !!(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM);

/** Construit le message WhatsApp/texte pour le restaurateur. */
function buildOrderMessage(
  lang: "fr" | "ar",
  data: {
    ref: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    items: unknown;
    total: number;
    deliveryMode: string;
    paymentMethod: string;
  }
): string {
  const itemsText = Array.isArray(data.items)
    ? (data.items as Array<{ name?: string; qty?: number; quantity?: number; price?: number }>)
        .map(i => `  • ${i.qty ?? i.quantity ?? 1}× ${i.name ?? "?"} — ${i.price ?? "?"}MAD`)
        .join("\n")
    : String(data.items);

  if (lang === "ar") {
    return [
      `🔔 *طلب جديد - Bridge Safi*`,
      `📋 مرجع: ${data.ref}`,
      ``,
      `👤 العميل: ${data.customerName}`,
      `📞 هاتف: ${data.customerPhone}`,
      `📍 العنوان: ${data.deliveryAddress}`,
      ``,
      `📦 الطلبات:`,
      itemsText,
      ``,
      `💰 المجموع: ${data.total} MAD`,
      `🚚 نوع التوصيل: ${data.deliveryMode}`,
      `💳 الدفع: ${data.paymentMethod}`,
      ``,
      `⏱️ يرجى تأكيد الاستلام في أقرب وقت.`,
    ].join("\n");
  }

  return [
    `🔔 *Nouvelle commande Bridge Safi*`,
    `📋 Réf: ${data.ref}`,
    ``,
    `👤 Client: ${data.customerName}`,
    `📞 Tél: ${data.customerPhone}`,
    `📍 Adresse: ${data.deliveryAddress}`,
    ``,
    `📦 Articles:`,
    itemsText,
    ``,
    `💰 Total: ${data.total} MAD`,
    `🚚 Mode: ${data.deliveryMode}`,
    `💳 Paiement: ${data.paymentMethod}`,
    ``,
    `⏱️ Merci de confirmer la réception dès que possible.`,
  ].join("\n");
}

/** Envoie un message WhatsApp via Twilio. */
async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!twilioReady) {
    logger.warn({ to }, "Twilio non configuré — WhatsApp non envoyé");
    return;
  }
  const fromWA = TWILIO_FROM!.startsWith("whatsapp:") ? TWILIO_FROM! : `whatsapp:${TWILIO_FROM!}`;
  const toWA   = to.startsWith("whatsapp:")           ? to            : `whatsapp:${to}`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ From: fromWA, To: toWA, Body: body }).toString(),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio WA error: ${err}`);
  }
}

/** Lance un appel vocal Twilio avec un message TTS. */
async function makeCall(to: string, message: string): Promise<void> {
  if (!twilioReady) {
    logger.warn({ to }, "Twilio non configuré — appel non lancé");
    return;
  }
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="fr-MA" voice="Polly.Celine" loop="2">${message}</Say>
</Response>`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_FROM!,
        To: to,
        Twiml: twiml,
      }).toString(),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio call error: ${err}`);
  }
}

/** Point d'entrée principal — appelé à chaque nouvelle commande. */
export async function notifyRestaurant(
  restaurantName: string | null | undefined,
  orderData: {
    ref: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    items: unknown;
    total: number;
    deliveryMode: string;
    paymentMethod: string;
  }
): Promise<void> {
  if (!restaurantName) return;

  const contact = RESTAURANT_CONTACTS[restaurantName];
  if (!contact || !contact.phone) {
    logger.info({ restaurantName }, "Restaurateur sans numéro configuré — notification ignorée");
    return;
  }

  const lang = contact.lang ?? "fr";
  const message = buildOrderMessage(lang, orderData);

  // WhatsApp
  if (contact.wa !== false) {
    try {
      await sendWhatsApp(contact.phone, message);
      logger.info({ restaurantName, phone: contact.phone }, "WhatsApp restaurateur envoyé");
    } catch (err) {
      logger.error({ err, restaurantName }, "Échec envoi WhatsApp restaurateur");
    }
  }

  // Appel vocal
  if (contact.call) {
    const callMsg = lang === "ar"
      ? `مرحبا، لديك طلب جديد على Bridge Safi. المجموع ${orderData.total} درهم. يرجى تأكيد الاستلام.`
      : `Bonjour, vous avez une nouvelle commande sur Bridge Safi. Total ${orderData.total} dirhams. Merci de confirmer.`;
    try {
      await makeCall(contact.phone, callMsg);
      logger.info({ restaurantName, phone: contact.phone }, "Appel vocal restaurateur lancé");
    } catch (err) {
      logger.error({ err, restaurantName }, "Échec appel vocal restaurateur");
    }
  }
}
