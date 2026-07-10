/**
 * ══════════════════════════════════════════════════════════════
 *  Bridge Safi — Alerte WhatsApp admin (zabi) en cas de signalement
 *
 *  Quand un client signale un problème sur une commande (colis manquant,
 *  retard, comportement...), on envoie un message WhatsApp direct à zabi
 *  avec le nom/prénom + la photo du livreur concerné + le message du client.
 *  Ça vient EN PLUS du flux existant vers Manager — ne remplace rien.
 *
 *  Réutilise les mêmes identifiants Twilio que notify-restaurant.ts :
 *    TWILIO_ACCOUNT_SID
 *    TWILIO_AUTH_TOKEN
 *    TWILIO_PHONE_NUMBER
 *
 *  Le numéro WhatsApp de zabi est dans ADMIN_WHATSAPP_NUMBER (env var).
 * ══════════════════════════════════════════════════════════════
 */

import { logger } from "./logger";

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM  = process.env.TWILIO_PHONE_NUMBER;
const ADMIN_PHONE  = process.env.ADMIN_WHATSAPP_NUMBER; // ex: "+2126XXXXXXXX"

const twilioReady = !!(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && ADMIN_PHONE);

async function sendWhatsApp(to: string, body: string): Promise<void> {
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

/**
 * Envoie l'alerte de signalement à zabi. Best-effort : ne jette jamais,
 * juste log si Twilio n'est pas configuré ou si l'envoi échoue.
 */
export async function notifyAdminReport(data: {
  ref: string;
  reason: string;
  customerName?: string;
  driverName?: string;
  driverPhoto?: string;
  driverPhone?: string;
}): Promise<void> {
  if (!twilioReady) {
    logger.warn({ ref: data.ref }, "Twilio ou ADMIN_WHATSAPP_NUMBER non configuré — alerte signalement non envoyée");
    return;
  }

  const lines = [
    `🚨 *Signalement Bridge Safi*`,
    ``,
    `📋 Commande: ${data.ref}`,
    data.customerName ? `👤 Client: ${data.customerName}` : null,
    `🛵 Livreur: ${data.driverName || "Non assigné"}`,
    data.driverPhone ? `📞 Tél. livreur: ${data.driverPhone}` : null,
    ``,
    `💬 Message du client:`,
    `"${data.reason}"`,
  ].filter((l): l is string => !!l);

  // La photo du livreur est envoyée en lien texte a la fin du message (pas de
  // media Twilio séparé pour rester simple) si dispo.
  const body = data.driverPhoto
    ? [...lines, ``, `🖼️ Photo livreur: ${data.driverPhoto}`].join("\n")
    : lines.join("\n");

  try {
    await sendWhatsApp(ADMIN_PHONE!, body);
    logger.info({ ref: data.ref }, "Alerte WhatsApp signalement envoyée à l'admin");
  } catch (err) {
    logger.error({ err, ref: data.ref }, "Échec envoi alerte WhatsApp signalement");
  }
}
