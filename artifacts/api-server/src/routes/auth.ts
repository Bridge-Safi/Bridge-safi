/**
 * auth.ts — Routes d'authentification Bridge
 * Routes:
 *   POST /api/auth/register  — créer un compte (téléphone OU email + mot de passe)
 *   POST /api/auth/login     — se connecter (téléphone OU email + mot de passe)
 *   GET  /api/auth/me        — profil de l'utilisateur connecté
 *
 * Zéro dépendance externe : JWT maison + SHA-256 (Node crypto natif)
 */

import { Router } from "express";
import { createHash, createHmac, randomUUID } from "crypto";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

function b64url(s: string): string {
  return Buffer.from(s).toString("base64url");
}

const JWT_SECRET = () => process.env.SESSION_SECRET || "bridge-safi-jwt-secret-change-me";

function signJWT(payload: Record<string, unknown>, expiresInDays = 30): string {
  const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now     = Math.floor(Date.now() / 1000);
  const claims  = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInDays * 86400 }));
  const sig     = createHmac("sha256", JWT_SECRET()).update(`${header}.${claims}`).digest("base64url");
  return `${header}.${claims}.${sig}`;
}

export function verifyJWT(token: string): Record<string, any> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, claims, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET()).update(`${header}.${claims}`).digest("base64url");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(claims, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${password}:bridge_safi_2026`).digest("hex");
}

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function normalizePhone(raw: string): string {
  let p = raw.trim().replace(/[\s\-().]/g, "");
  if (p.startsWith("00212")) p = "+" + p.slice(2);
  else if (p.startsWith("212") && p.length >= 12) p = "+" + p;
  else if (p.startsWith("0") && p.length === 10) p = "+212" + p.slice(1);
  else if (!p.startsWith("+")) p = "+212" + p;
  return p;
}

function normalizeIdentifier(raw: string): { type: "email" | "phone"; value: string } {
  const trimmed = raw.trim();
  if (isEmail(trimmed)) return { type: "email", value: trimmed.toLowerCase() };
  return { type: "phone", value: normalizePhone(trimmed) };
}

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      phone         TEXT UNIQUE,
      email         TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      salt          TEXT NOT NULL,
      name          TEXT,
      role          TEXT NOT NULL DEFAULT 'client',
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
  `);
}
ensureUsersTable().catch(err => logger.error({ err }, "Failed to create users table"));

router.post("/auth/register", async (req, res) => {
  const { identifier, phone, email, password, name } = req.body as {
    identifier?: string; phone?: string; email?: string; password?: string; name?: string;
  };
  const rawId = identifier || phone || email || "";
  if (!rawId.trim()) { res.status(400).json({ error: "Numéro de téléphone ou adresse email requis" }); return; }
  if (!password || password.length < 8) { res.status(400).json({ error: "Mot de passe trop faible (8 caractères min.)" }); return; }
  const { type, value } = normalizeIdentifier(rawId);
  const cleanName = (name || "").trim() || null;
  try {
    const col = type === "email" ? "email" : "phone";
    const existing = await pool.query(`SELECT id FROM users WHERE ${col} = $1`, [value]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: type === "email" ? "Cette adresse email est déjà utilisée. Connectez-vous." : "Ce numéro est déjà utilisé. Connectez-vous." }); return;
    }
    const userId = "usr_" + randomUUID().replace(/-/g, "").slice(0, 16);
    const salt   = randomUUID();
    const hash   = hashPassword(password, salt);
    if (type === "email") {
      await pool.query(`INSERT INTO users (id, email, password_hash, salt, name, role) VALUES ($1,$2,$3,$4,$5,'client')`, [userId, value, hash, salt, cleanName]);
    } else {
      await pool.query(`INSERT INTO users (id, phone, password_hash, salt, name, role) VALUES ($1,$2,$3,$4,$5,'client')`, [userId, value, hash, salt, cleanName]);
    }
    await pool.query(
      `INSERT INTO user_profiles (user_id, phone, name) VALUES ($1,$2,$3) ON CONFLICT (user_id) DO UPDATE SET phone=COALESCE($2, user_profiles.phone), name=$3`,
      [userId, type === "phone" ? value : null, cleanName],
    );
    const token = signJWT({ sub: userId, identifier: value, type, role: "client" });
    logger.info({ userId, type, value }, "New user registered");
    res.status(201).json({ token, user: { id: userId, phone: type === "phone" ? value : null, email: type === "email" ? value : null, name: cleanName || "", role: "client" } });
  } catch (err) { logger.error({ err }, "Register error"); res.status(500).json({ error: "Erreur serveur. Réessayez." }); }
});

router.post("/auth/login", async (req, res) => {
  const { identifier, phone, email, password } = req.body as {
    identifier?: string; phone?: string; email?: string; password?: string;
  };
  const rawId = identifier || phone || email || "";
  if (!rawId.trim()) { res.status(400).json({ error: "Numéro ou email requis" }); return; }
  if (!password)     { res.status(400).json({ error: "Mot de passe requis" }); return; }
  const { type, value } = normalizeIdentifier(rawId);
  const col = type === "email" ? "email" : "phone";
  try {
    const result = await pool.query(`SELECT id, password_hash, salt, name, role, phone, email FROM users WHERE ${col} = $1`, [value]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: type === "email" ? "Compte introuvable. Vérifiez votre adresse email." : "Compte introuvable. Vérifiez votre numéro." }); return;
    }
    const u = result.rows[0];
    if (hashPassword(password, u.salt) !== u.password_hash) { res.status(401).json({ error: "Mot de passe incorrect." }); return; }
    const token = signJWT({ sub: u.id, identifier: value, type, role: u.role || "client" });
    logger.info({ userId: u.id }, "User logged in");
    res.json({ token, user: { id: u.id, phone: u.phone || null, email: u.email || null, name: u.name || "", role: u.role || "client" } });
  } catch (err) { logger.error({ err }, "Login error"); res.status(500).json({ error: "Erreur serveur." }); }
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifié" }); return; }
  const payload = verifyJWT(authHeader.slice(7));
  if (!payload?.sub) { res.status(401).json({ error: "Token invalide ou expiré" }); return; }
  try {
    const result = await pool.query("SELECT id, phone, email, name, role FROM users WHERE id = $1", [payload.sub]);
    if (result.rows.length === 0) { res.status(401).json({ error: "Compte introuvable" }); return; }
    const u = result.rows[0];
    const profile = await pool.query("SELECT avatar_data FROM user_profiles WHERE user_id = $1", [u.id]);
    const imageUrl = profile.rows[0]?.avatar_data ? `/api/profile/avatar/${encodeURIComponent(u.id)}` : "";
    res.json({ id: u.id, phone: u.phone || null, email: u.email || null, name: u.name || "", role: u.role || "client", imageUrl });
  } catch (err) { logger.error({ err }, "/auth/me error"); res.status(500).json({ error: "Erreur serveur" }); }
});

export default router;
