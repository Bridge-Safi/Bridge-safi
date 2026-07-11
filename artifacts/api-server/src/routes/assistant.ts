import { Router } from "express";
import OpenAI from "openai";
const router = Router();

// Fournisseur principal : Google Gemini (gratuit) via son endpoint compatible OpenAI.
// Si GEMINI_API_KEY n'est pas defini, ou si l'appel Gemini echoue, on retombe
// automatiquement sur l'ancien fournisseur (Groq / OpenAI) pour ne jamais couper le service.
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const LEGACY_MODEL = process.env.AI_LEGACY_MODEL || "llama-3.3-70b-versatile";
const AI_TIMEOUT_MS = 25_000;

function getGemini(): OpenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: GEMINI_BASE_URL, timeout: AI_TIMEOUT_MS, maxRetries: 1 });
}

function getLegacy(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}), timeout: AI_TIMEOUT_MS, maxRetries: 1 });
}

const BRIDGE_SYSTEM_PROMPT = `Tu es l'assistant IA de Bridge Safi, un service premium de livraison à domicile basé à Safi, Maroc.
Bridge Safi propose 4 services : Bridge Eats 🛵 (livraison repas), Bridge Taxi 🚖 (transport), Bridge Tabac 🚬 (cigarettes & boissons), Bridge Fleurs 🌹 (fleurs & cadeaux).
Ton rôle :
1. Répondre aux questions des clients en français, arabe, anglais ou amazigh selon leur langue
2. Guider les clients à travers un questionnaire pour résoudre leurs problèmes
3. Si tu ne peux pas résoudre le problème après 3 échanges, dire que tu vas alerter le propriétaire
Problèmes courants que tu peux résoudre :
- Suivi de commande : demander le numéro de référence (format BR-XXXX ou TC-XXXX ou TB-XXXX)
- Retard de livraison : rassurer, estimer 18-35 min, proposer de contacter le livreur
- Problème de paiement : guider vers les options QR, cash, Apple Pay, Google Pay, carte
- Commande incorrecte : noter le problème et promettre un remboursement ou renvoi
- Zone de livraison : Safi uniquement pour Eats et Tabac, partout au Maroc pour Taxi
- Bridge Game / Diamants : 1000 diamants = 5 DH, échangeables contre menus/tabac/fleurs
- Horaires : Bridge Safi est disponible 7j/7, de 8h à minuit
Ton attitude : chaleureux, professionnel, efficace. Maximum 3-4 phrases par réponse.
Si après 3 tentatives tu n'as pas résolu le problème, réponds EXACTEMENT avec ce préfixe :
"[ESCALADE] Je vais alerter notre équipe. Un responsable vous recontactera dans moins de 30 minutes. 📱"`;

type ChatMsg = { role: "user" | "assistant"; content: string };

async function askModel(client: OpenAI, model: string, systemPrompt: string, messages: ChatMsg[]) {
  const completion = await client.chat.completions.create({
    model,
    max_tokens: 512,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  });
  return completion.choices[0]?.message?.content ?? "";
}

router.post("/assistant/chat", async (req, res) => {
  try {
    const { messages, lang } = req.body as { messages: ChatMsg[]; lang?: string };
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages required" });
      return;
    }
    // On limite l'historique envoyé au modèle pour éviter les dépassements de tokens.
    const recent = messages.slice(-12);
    const langHint =
      lang === "ar"
        ? "Réponds en arabe."
        : lang === "en"
          ? "Reply in English."
          : lang === "amz"
            ? "Réponds en français (amazigh non disponible en IA)."
            : "Réponds en français.";
    const systemPrompt = `${BRIDGE_SYSTEM_PROMPT}\n\n${langHint}`;

    const gemini = getGemini();
    const legacy = getLegacy();
    let reply = "";
    if (gemini) {
      try {
        reply = await askModel(gemini, GEMINI_MODEL, systemPrompt, recent);
      } catch (err) {
        req.log?.warn(err, "gemini failed, falling back to legacy provider");
        if (legacy) reply = await askModel(legacy, LEGACY_MODEL, systemPrompt, recent);
        else throw err;
      }
    } else if (legacy) {
      reply = await askModel(legacy, LEGACY_MODEL, systemPrompt, recent);
    } else {
      res.status(500).json({ error: "AI not configured" });
      return;
    }
    const isEscalation = reply.includes("[ESCALADE]");
    res.json({ reply, isEscalation });
  } catch (err) {
    req.log?.error(err, "assistant chat error");
    res.status(500).json({ error: "AI unavailable" });
  }
});

export default router;
