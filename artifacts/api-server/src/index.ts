import { readdirSync, readFileSync, readlinkSync } from "fs";
import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      ref TEXT NOT NULL UNIQUE,
      service TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      items JSONB NOT NULL,
      total INTEGER NOT NULL,
      delivery_mode TEXT NOT NULL DEFAULT 'delivery',
      payment_method TEXT NOT NULL DEFAULT 'cash',
      restaurant_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      driver_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      driver_name TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  logger.info("Database schema ready");
}

/** Kill all processes that hold the given port, using /proc (no external tools needed). */
function freePort(p: number): void {
  try {
    const hex = p.toString(16).toUpperCase().padStart(4, "0");
    const lines = [
      ...readFileSync("/proc/net/tcp6", "utf8").split("\n"),
      ...readFileSync("/proc/net/tcp", "utf8").split("\n"),
    ];
    const inodes = new Set<string>();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      // parts[1]=local_addr  parts[3]=state(0A=LISTEN)  parts[9]=inode
      if (parts[1]?.toUpperCase().endsWith(`:${hex}`) && parts[3] === "0A") {
        if (parts[9] && parts[9] !== "0") inodes.add(parts[9]);
      }
    }
    if (inodes.size === 0) return;
    const pids = readdirSync("/proc").filter((f) => /^\d+$/.test(f));
    for (const pid of pids) {
      try {
        const fds = readdirSync(`/proc/${pid}/fd`);
        for (const fd of fds) {
          try {
            const link = readlinkSync(`/proc/${pid}/fd/${fd}`);
            if (inodes.has(link.replace(/^socket:\[(\d+)\]$/, "$1"))) {
              logger.warn({ pid, port: p }, "Killing process holding port");
              process.kill(Number(pid), "SIGKILL");
            }
          } catch { /* fd may vanish */ }
        }
      } catch { /* process may vanish */ }
    }
  } catch { /* /proc unavailable — ignore */ }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function startServer(attempt = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err?: Error) => {
      if (err) { reject(err); return; }
      logger.info({ port }, "Server listening");
      resolve();
    });

    server.on("error", async (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        if (attempt > 15) {
          logger.error({ port, attempt }, "Port still in use after 15 retries — giving up");
          reject(err);
          return;
        }
        logger.warn({ port, attempt }, "Port in use — freeing and retrying in 3 s...");
        try { server.close(); } catch { /* ignore */ }
        freePort(port);
        await sleep(3000);
        try { resolve(await startServer(attempt + 1)); }
        catch (e) { reject(e); }
      } else {
        reject(err);
      }
    });
  });
}

migrate()
  .then(() => startServer())
  .catch((err) => {
    logger.error({ err }, "Server failed to start");
    process.exit(1);
  });
