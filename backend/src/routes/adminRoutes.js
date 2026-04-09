import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { analytics, assignJudge, listUsers, overview } from "../controllers/adminController.js";

export const adminRoutes = express.Router();

adminRoutes.get("/events/:eventId/overview", requireAuth, requireRole("admin"), overview);
adminRoutes.get("/events/:eventId/analytics", requireAuth, requireRole("admin"), analytics);
adminRoutes.get("/users", requireAuth, requireRole("admin"), listUsers);
adminRoutes.post("/events/:eventId/teams/:teamId/assign-judge", requireAuth, requireRole("admin"), assignJudge);

