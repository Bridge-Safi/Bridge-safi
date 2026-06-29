/**
 * app.ts — Serveur Express Bridge (SANS Clerk)
 */

import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { jwtMiddleware } from "./middlewares/jwtMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Bridge Game launcher ──────────────────────────────────────────────────────
const GAME_EXTERNAL_URL = "https://bridge-safi.replit.app";
const bridgeGameHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Bridge Game · Safi Runner</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;font-family:'Inter',-apple-system,sans-serif;
  background:linear-gradient(160deg,#010d08 0%,#032218 30%,#054130 60%,#021a10 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  position:relative;overflow:hidden;color:white}
.bg{position:absolute;inset:0;opacity:.04;
  background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D9C5A0'%3E%3Cpath d='M30 0L0 30L30 60L60 30L30 0zm0 10L50 30L30 50L10 30L30 10z'/%3E%3C/g%3E%3C/svg%3E");
  background-size:60px 60px}
.glow{position:absolute;top:0;left:-20%;right:-20%;height:400px;
  background:radial-gradient(ellipse at 50% 0%,rgba(6,95,70,.25) 0%,transparent 70%);pointer-events:none}
.wrap{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:0 24px;max-width:420px;width:100%}
.logo{width:110px;height:110px;border-radius:50%;overflow:hidden;border:3px solid #D9C5A0;
  box-shadow:0 0 0 8px rgba(217,197,160,.08),0 20px 60px rgba(0,0,0,.5);margin-bottom:1.5rem;
  animation:glow 2.8s ease-in-out infinite}
.logo img{width:100%;height:100%;object-fit:cover;transform:scale(1.15)}
h1{font-weight:900;font-size:2rem;letter-spacing:.5em;text-align:center;
  text-shadow:0 2px 20px rgba(0,0,0,.5);margin-bottom:4px}
.sub{color:#D9C5A0;font-size:.65rem;letter-spacing:.25em;font-weight:700;opacity:.9;margin-bottom:6px}
.play{display:block;width:100%;padding:1.1rem;
  background:linear-gradient(135deg,#065F46 0%,#033d2c 100%);
  border:1.5px solid rgba(217,197,160,.35);border-radius:20px;color:white;font-weight:900;
  font-size:1.05rem;letter-spacing:.12em;text-decoration:none;text-align:center;cursor:pointer;
  font-family:inherit}
@keyframes glow{0%,100%{box-shadow:0 0 30px rgba(6,95,70,.4)}50%{box-shadow:0 0 60px rgba(6,95,70,.7)}}
</style>
</head>
<body>
<div class="bg"></div><div class="glow"></div>
<div class="wrap">
  <div class="logo"><img src="/logo_splash_new.png" alt="Bridge"/></div>
  <h1>BRIDGE</h1>
  <p class="sub">SAFI · MAROC · آسفي · ⵙⴰⴼⵉ</p>
  <a class="play" href="${GAME_EXTERNAL_URL}" target="_blank" rel="noopener noreferrer">🎮 JOUER MAINTENANT</a>
</div>
</body>
</html>`;

app.get(["/bridge-game", "/bridge-game/"], (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(bridgeGameHtml);
});

app.get("/api/healthz", (_req, res) => { res.json({ status: "ok" }); });

app.use(jwtMiddleware);
app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(process.cwd(), "artifacts/grado-eats/dist/public");
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req, res) => { res.sendFile(path.join(frontendDist, "index.html")); });
}

export default app;
