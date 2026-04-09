import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import { authRoutes } from "./routes/authRoutes.js";
import { eventRoutes } from "./routes/eventRoutes.js";
import { teamRoutes } from "./routes/teamRoutes.js";
import { submissionRoutes } from "./routes/submissionRoutes.js";
import { judgeRoutes } from "./routes/judgeRoutes.js";
import { leaderboardRoutes } from "./routes/leaderboardRoutes.js";
import { announcementRoutes } from "./routes/announcementRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 240
    })
  );

  app.get("/health", (req, res) => res.json({ ok: true, name: "hackforge-api" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api", teamRoutes);
  app.use("/api", submissionRoutes);
  app.use("/api/judge", judgeRoutes);
  app.use("/api", leaderboardRoutes);
  app.use("/api", announcementRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(errorHandler);
  return app;
}

