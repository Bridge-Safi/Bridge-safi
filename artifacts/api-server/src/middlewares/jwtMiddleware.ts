/**
 * jwtMiddleware.ts — Middleware JWT Bridge (remplace clerkMiddleware)
 * DESTINATION : artifacts/api-server/src/middlewares/jwtMiddleware.ts
 */

import { Request, Response, NextFunction } from "express";
import { verifyJWT } from "../routes/auth";

declare global {
  namespace Express {
    interface Request {
      auth: { userId: string | null };
    }
  }
}

export function jwtMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    req.auth = { userId: null };
    return next();
  }
  const payload = verifyJWT(authHeader.slice(7));
  req.auth = { userId: payload?.sub ?? null };
  next();
}
