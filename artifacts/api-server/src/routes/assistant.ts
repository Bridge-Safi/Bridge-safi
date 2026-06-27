import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function getOpenAI() {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  return new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
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

router.post("/assistant/chat", async (req, res) => {
  try {
    const { messages, lang } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      lang?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages required" });
      return;
    }

    const langHint =
      lang === "ar"
        ? "Réponds en arabe."
        : lang === "en"
          ? "Reply in English."
          : lang === "amz"
            ? "Réponds en français (amazigh non disponible en IA)."
            : "Réponds en français.";

    const completion = await OpenAI.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        { role: "system", content: `${BRIDGE_SYSTEM_PROMPT}\n\n${langHint}` },
        ...messages,
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    const isEscalation = reply.includes("[ESCALADE]");

    res.json({ reply, isEscalation });
  } catch (err) {
    req.log?.error(err, "assistant chat error");
    res.status(500).json({ error: "AI unavailable" });
  }
});

export default router;
