/**
 * Clerk Frontend API Proxy Middleware
 *
 * Proxies Clerk Frontend API requests through our domain to Clerk's FAPI endpoint.
 * Uses native Node.js http/https -- no external dependencies.
 * Only active in production.
 *
 * Usage in app.ts:
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import type { RequestHandler } from "express";
import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

const CLERK_FAPI = process.env.CLERK_FAPI_URL || "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

export function clerkProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  const targetBase = new URL(CLERK_FAPI);
  const lib = targetBase.protocol === "https:" ? https : http;

  return (req, res) => {
    const strippedPath = req.path.replace(CLERK_PROXY_PATH, "") || "/";
    const search = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const targetPath = strippedPath + search;

    const xff = req.headers["x-forwarded-for"];
    const clientIp =
      (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = req.headers.host || "";
    const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;

    const forwardHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key === "host" || key === "connection") continue;
      forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : (value ?? "");
    }
    forwardHeaders["host"] = targetBase.host;
    forwardHeaders["Clerk-Proxy-Url"] = proxyUrl;
    forwardHeaders["Clerk-Secret-Key"] = secretKey;
    if (clientIp) forwardHeaders["X-Forwarded-For"] = clientIp;

    const proxyReq = lib.request(
      {
        hostname: targetBase.hostname,
        port: targetBase.port || (targetBase.protocol === "https:" ? 443 : 80),
        path: targetPath,
        method: req.method,
        headers: forwardHeaders,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers as Record<string, string>);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", (err) => {
      console.error("[clerk-proxy] error:", err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: "Clerk proxy error" });
      }
    });

    req.pipe(proxyReq);
  };
}
