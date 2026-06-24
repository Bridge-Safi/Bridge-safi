import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as https from 'https';
import { URL } from 'url';

const CLERK_FAPI = 'https://clerk.safi-bridge.ma';
export const CLERK_PROXY_PATH = '/api/__clerk';
const PROXY_PREFIX = CLERK_PROXY_PATH;

export function clerkProxyMiddleware(): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.path.startsWith(PROXY_PREFIX)) return next();

    const targetPath = req.path.slice(PROXY_PREFIX.length) || '/';
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const target = new URL(targetPath + qs, CLERK_FAPI);

    const headers: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers[k] = v as string | string[];
    }
    headers['host'] = target.hostname;
    headers['x-forwarded-host'] = req.headers.host || '';
    headers['x-forwarded-proto'] = 'https';
    headers['x-forwarded-for'] = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    delete headers['content-length'];

    const options: https.RequestOptions = {
      hostname: target.hostname,
      port: 443,
      path: target.pathname + target.search,
      method: req.method,
      headers,
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.status(proxyRes.statusCode || 200);
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (v) res.setHeader(k, v);
      }
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[clerk-proxy] error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'proxy_error' });
    });

    req.pipe(proxyReq);
  };
}
