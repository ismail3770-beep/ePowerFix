// ePowerFix Express API Server (Skeleton)
// This is a placeholder skeleton. The actual API routes currently live in
// apps/web/src/app/api/ as Next.js API routes. They will be migrated here
// incrementally when we switch the backend from Next.js API Routes to Express.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();
const PORT = 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ePowerFix API",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
});

// ─── API Info ─────────────────────────────────────────────────────────────────
app.get("/api", (_req, res) => {
  res.json({
    name: "ePowerFix API",
    version: "0.1.0",
    docs: "/api/docs",
    health: "/api/health",
    endpoints: {
      products: "/api/products",
      orders: "/api/orders",
      auth: "/api/auth",
    },
    note: "This is a skeleton. Routes are currently served by Next.js API Routes in apps/web/src/app/api/",
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 ePowerFix API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
