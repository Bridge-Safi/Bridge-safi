import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Bridge Game launcher page — registered BEFORE Clerk so it is never intercepted ──

// Serves a standalone launcher page at /bridge-game/ pointing to the external game.
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
.bar{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem}
.bar-line{width:50px;height:1px;background:linear-gradient(to right,transparent,#D9C5A0)}
.bar-line.r{background:linear-gradient(to left,transparent,#D9C5A0)}
.bar-diamond{width:6px;height:6px;background:#D9C5A0;transform:rotate(45deg);flex-shrink:0}
.gem-box{background:rgba(255,255,255,.04);border:1px solid rgba(217,197,160,.2);border-radius:20px;
  padding:1rem 2rem;margin-bottom:2rem;text-align:center;backdrop-filter:blur(8px)}
.gem{font-size:2.5rem;margin-bottom:.25rem;animation:shimmer 2s ease-in-out infinite}
.gem-title{color:#D9C5A0;font-size:.7rem;letter-spacing:.15em;font-weight:700}
.gem-sub{color:rgba(255,255,255,.45);font-size:.6rem;margin-top:4px;letter-spacing:.08em}
.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:2rem;width:100%}
.stat{background:rgba(255,255,255,.04);border:1px solid rgba(217,197,160,.12);border-radius:14px;
  padding:.75rem .5rem;text-align:center;backdrop-filter:blur(8px)}
.stat-icon{font-size:1.25rem;margin-bottom:4px}
.stat-val{color:white;font-weight:900;font-size:.8rem}
.stat-lbl{color:rgba(255,255,255,.35);font-size:.55rem;margin-top:2px;letter-spacing:.05em}
.play{display:block;width:100%;padding:1.1rem;
  background:linear-gradient(135deg,#065F46 0%,#033d2c 100%);
  border:1.5px solid rgba(217,197,160,.35);border-radius:20px;color:white;font-weight:900;
  font-size:1.05rem;letter-spacing:.12em;text-decoration:none;text-align:center;
  box-shadow:0 0 30px rgba(6,95,70,.4),0 20px 60px rgba(0,0,0,.5);
  cursor:pointer;transition:transform .15s ease;margin-bottom:1rem;
  animation:glow 2.8s ease-in-out infinite;font-family:inherit}
.play:hover{transform:scale(1.04)}
.play:active{transform:scale(.97)}
.rate{color:rgba(217,197,160,.6);font-size:.62rem;letter-spacing:.1em;text-align:center;font-weight:600}
.footer{color:rgba(255,255,255,.15);font-size:.55rem;letter-spacing:.15em;text-align:center;margin-top:2.5rem}
@keyframes glow{0%{box-shadow:0 0 30px rgba(6,95,70,.4),0 20px 60px rgba(0,0,0,.5)}
  50%{box-shadow:0 0 60px rgba(6,95,70,.7),0 20px 80px rgba(0,0,0,.5)}
  100%{box-shadow:0 0 30px rgba(6,95,70,.4),0 20px 60px rgba(0,0,0,.5)}}
@keyframes shimmer{0%,100%{opacity:.7}50%{opacity:1}}
</style>
</head>
<body>
<div class="bg"></div>
<div class="glow"></div>
<div class="wrap">
  <div class="logo"><img src="/logo_splash_new.png" alt="Bridge" onerror="this.style.display='none'"/></div>
  <h1>BRIDGE</h1>
  <p class="sub">SAFI · MAROC · آسفي · ⵙⴰⴼⵉ</p>
  <div class="bar">
    <div class="bar-line"></div>
    <div class="bar-diamond"></div>
    <div class="bar-line r"></div>
  </div>
  <div class="gem-box">
    <div class="gem">💎</div>
    <div class="gem-title">SAFI RUNNER</div>
    <div class="gem-sub">Gagne des diamants · Échange contre des MAD</div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-icon">⏱️</div><div class="stat-val">9h</div><div class="stat-lbl">3 jours · 3h/j</div></div>
    <div class="stat"><div class="stat-icon">💎</div><div class="stat-val">6 000</div><div class="stat-lbl">💎 / heure</div></div>
    <div class="stat"><div class="stat-icon">🛵</div><div class="stat-val">300 MAD</div><div class="stat-lbl">bonus livraison</div></div>
  </div>
  <a class="play" href="${GAME_EXTERNAL_URL}" target="_blank" rel="noopener noreferrer">🎮 JOUER MAINTENANT</a>
  <p class="rate">200 💎 = 1 MAD · 60 000 💎 = 300 MAD</p>
  <p class="footer">© 2026 BRIDGE SAFI · safi-bridge.ma · 🔒 Sécurisé</p>
</div>
</body>
</html>`;

app.get(["/bridge-game", "/bridge-game/"], (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(bridgeGameHtml);
});

// ── Healthcheck — BEFORE Clerk so it always responds 200 ─────────────────────
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Clerk auth + API routes (after bridge-game so Clerk never intercepts it) ─
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}));

app.use("/api", router);

// ── Production: serve the built frontend (Railway deployment) ─────────────────
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(process.cwd(), "artifacts/grado-eats/dist/public");
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
