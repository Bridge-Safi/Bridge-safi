import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const DRIVER_KEY = process.env.DRIVER_KEY ?? "BRIDGE-DRIVER-2025";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY ?? "";
const APP_DOMAIN = "https://safi-bridge.ma";

/** POST /api/admin/sign-in-link
 *  Body: { email: string, adminKey: string }
 *  Returns: { url: string } — lien de connexion direct valable 1h
 */
router.post("/admin/sign-in-link", async (req, res) => {
  const { email, adminKey } = req.body ?? {};

  if (adminKey !== DRIVER_KEY) {
    res.status(401).json({ error: "Clé admin invalide." });
    return;
  }
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email requis." });
    return;
  }

  try {
    // 1. Find the user by email
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email.trim())}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET}` } }
    );
    const users = (await searchRes.json()) as any[];

    if (!Array.isArray(users) || users.length === 0) {
      res.status(404).json({ error: `Aucun compte trouvé pour ${email}.` });
      return;
    }

    const userId = users[0].id;

    // 2. Generate a sign-in token (valid 1h)
    const tokenRes = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLERK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId, expires_in_seconds: 3600 }),
    });
    const tokenData: any = await tokenRes.json();

    if (!tokenData.token) {
      res.status(500).json({ error: "Impossible de générer le token Clerk." });
      return;
    }

    // 3. Build the link pointing to the app's sign-in page
    const url = `${APP_DOMAIN}/sign-in?__clerk_ticket=${tokenData.token}`;

    req.log.info({ userId, email }, "Admin sign-in link generated");
    res.json({ url, expiresIn: "1 heure" });
  } catch (err) {
    logger.error({ err }, "Admin sign-in link error");
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
