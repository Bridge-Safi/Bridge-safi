import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Temporary auth debug endpoint — shows what the server sees
router.get("/debug-auth", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const { userId, sessionId } = getAuth(req);
  res.json({
    hasAuthHeader: !!authHeader,
    authHeaderPrefix: authHeader.slice(0, 20) || "(none)",
    userId: userId || null,
    sessionId: sessionId || null,
  });
});

export default router;
