import { Router } from "express";

const router = Router();

// Driver code validation — POST /api/driver/verify
router.post("/driver/verify", (req, res) => {
  const { code } = req.body as { code?: string };
  const secret = process.env.DRIVER_CODE || "BRIDGE-DRIVER-2025";
  if (!code || code.trim().toUpperCase() !== secret.trim().toUpperCase()) {
    return res.status(401).json({ ok: false, error: "Code incorrect" });
  }
  res.json({ ok: true });
});

export default router;
