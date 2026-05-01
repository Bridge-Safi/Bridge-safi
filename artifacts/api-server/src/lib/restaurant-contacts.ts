/**
 * ══════════════════════════════════════════════════════════════
 *  BRIDGE SAFI — Contacts restaurateurs
 *  Quand le patron envoie les numéros, on les ajoute ici.
 *  Format : "+212XXXXXXXXX"  (indicatif Maroc obligatoire)
 * ══════════════════════════════════════════════════════════════
 *
 *  Pour chaque restaurant :
 *    phone  → numéro WhatsApp + appel vocal
 *    call   → true = appel automatique en plus du WA
 *    wa     → true = message WhatsApp (toujours recommandé)
 *    lang   → langue du message envoyé ('fr' | 'ar')
 */

export interface RestaurantContact {
  phone: string;        // ex: "+212612345678"
  call?: boolean;       // appel vocal automatique (Twilio)
  wa?: boolean;         // message WhatsApp (Twilio WA)
  lang?: "fr" | "ar";  // langue du message
}

/**
 * ─── AJOUTER LES NUMÉROS ICI ────────────────────────────────
 *  Clé = nom exact du restaurant tel qu'il apparaît dans la commande.
 *  Laisser phone: "" si le numéro n'est pas encore connu.
 */
export const RESTAURANT_CONTACTS: Record<string, RestaurantContact> = {
  // ── À REMPLIR dès réception des numéros ──
  "Kebab Express Safi": {
    phone: "",       // ← numéro à ajouter
    call: true,
    wa: true,
    lang: "fr",
  },
  "Pizza Safi": {
    phone: "",       // ← numéro à ajouter
    call: true,
    wa: true,
    lang: "fr",
  },
  "Burger House Safi": {
    phone: "",       // ← numéro à ajouter
    call: false,
    wa: true,
    lang: "fr",
  },
  "Restaurant Al Bahr": {
    phone: "",       // ← numéro à ajouter
    call: true,
    wa: true,
    lang: "ar",
  },
  "Café Central Safi": {
    phone: "",       // ← numéro à ajouter
    call: false,
    wa: true,
    lang: "fr",
  },
  // ── Nouveaux restaurants — ajouter ci-dessous ──
};
