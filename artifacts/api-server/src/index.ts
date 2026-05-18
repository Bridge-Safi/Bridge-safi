import { readdirSync, readFileSync, readlinkSync } from "fs";
import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY, ref TEXT NOT NULL UNIQUE, service TEXT NOT NULL,
      customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL, items JSONB NOT NULL, total INTEGER NOT NULL,
      delivery_mode TEXT NOT NULL DEFAULT 'delivery',
      payment_method TEXT NOT NULL DEFAULT 'cash', restaurant_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending', driver_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY, endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL, auth TEXT NOT NULL, driver_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS restaurants (
      name TEXT PRIMARY KEY,
      phone TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      webhook_url TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS webhook_token TEXT;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_id TEXT;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_email TEXT;
    ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS restaurant_name TEXT;
    CREATE TABLE IF NOT EXISTS game_diamonds (
      user_id TEXT PRIMARY KEY,
      diamonds INTEGER NOT NULL DEFAULT 0,
      total_earned INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS game_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      name TEXT,
      address TEXT,
      avatar_data TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS missions (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      reward_diamonds INTEGER NOT NULL,
      daily_limit INTEGER NOT NULL DEFAULT 1,
      duration_seconds INTEGER,
      external_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS mission_completions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      mission_id INTEGER NOT NULL,
      diamonds_awarded INTEGER NOT NULL,
      completed_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  logger.info("Database schema ready");
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

function isPortInUse(p: number): boolean {
  try {
    const hex = p.toString(16).toUpperCase().padStart(4, "0");
    const content = [
      readFileSync("/proc/net/tcp6", "utf8"),
      readFileSync("/proc/net/tcp",  "utf8"),
    ].join("\n");
    return content.split("\n").some((line) => {
      const parts = line.trim().split(/\s+/);
      return parts[1]?.toUpperCase().endsWith(`:${hex}`) && parts[3] === "0A";
    });
  } catch { return false; }
}

function killPortHolders(p: number): void {
  try {
    const hex = p.toString(16).toUpperCase().padStart(4, "0");
    const lines = [
      ...readFileSync("/proc/net/tcp6", "utf8").split("\n"),
      ...readFileSync("/proc/net/tcp",  "utf8").split("\n"),
    ];
    const inodes = new Set<string>();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts[1]?.toUpperCase().endsWith(`:${hex}`) && parts[3] === "0A") {
        if (parts[9] && parts[9] !== "0") inodes.add(parts[9]);
      }
    }
    if (inodes.size === 0) return;
    for (const pid of readdirSync("/proc").filter((f) => /^\d+$/.test(f))) {
      try {
        for (const fd of readdirSync(`/proc/${pid}/fd`)) {
          try {
            const link = readlinkSync(`/proc/${pid}/fd/${fd}`);
            const m = link.match(/^socket:\[(\d+)\]$/);
            if (m && inodes.has(m[1]) && Number(pid) !== process.pid) {
              logger.warn({ pid: Number(pid), port: p }, "Killing process holding port");
              process.kill(Number(pid), "SIGKILL");
            }
          } catch { /* fd may vanish */ }
        }
      } catch { /* process may vanish */ }
    }
  } catch { /* /proc unavailable */ }
}

/** Kill any process holding the port, then wait until it's actually free. */
async function ensurePortFree(p: number): Promise<void> {
  if (!isPortInUse(p)) return;
  logger.info({ port: p }, "Port in use — killing holder and waiting...");
  killPortHolders(p);
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (!isPortInUse(p)) {
      logger.info({ port: p, waited: i + 1 }, "Port is now free");
      return;
    }
    killPortHolders(p); // keep killing in case it restarted
  }
  logger.warn({ port: p }, "Port still in use after 30s — attempting to bind anyway");
}

async function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err?: Error) => {
      if (err) { reject(err); return; }
      logger.info({ port }, "Server listening");
      resolve();
    });
    server.once("error", reject);
  });
}

migrate()
  .then(() => ensurePortFree(port))
  .then(() => startServer())
  .catch((err) => {
    logger.error({ err }, "Server failed to start");
    process.exit(1);
  });
