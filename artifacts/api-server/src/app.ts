import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import { existsSync } from "fs";

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

app.use(clerkMiddleware());

app.use("/api", router);

// ── Production: serve built frontend static files ──────────────────────────
// In production (Railway/Render/etc.), the Express server serves both the API
// and the compiled React app. The frontend is built to artifacts/bridge-eats/dist/public.
if (process.env.NODE_ENV === "production") {
  // __dirname in the bundle = artifacts/api-server/dist/
  const staticDir = path.resolve(__dirname, "../../grado-eats/dist/public");
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
    // SPA fallback — all non-API routes serve index.html
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
    logger.info({ staticDir }, "Serving frontend static files");
  } else {
    logger.warn({ staticDir }, "Frontend build not found — static serving disabled");
  }
}

export default app;
