import express from "express";
import { attachUser, requireAuth, requireRole } from "../middleware/auth.js";
import {
  createTeam,
  joinTeam,
  myTeam,
  registerForEvent,
  teammateSuggestions,
  teamSuggestions
} from "../controllers/teamController.js";

export const teamRoutes = express.Router();

teamRoutes.post("/events/:eventId/register", requireAuth, requireRole("participant"), registerForEvent);
teamRoutes.get("/events/:eventId/my-team", requireAuth, requireRole("participant"), myTeam);

teamRoutes.post("/teams/create", requireAuth, requireRole("participant"), createTeam);
teamRoutes.post("/teams/join", requireAuth, requireRole("participant"), joinTeam);

teamRoutes.get(
  "/events/:eventId/suggestions/teammates",
  requireAuth,
  requireRole("participant"),
  attachUser,
  teammateSuggestions
);
teamRoutes.get("/events/:eventId/suggestions/teams", requireAuth, requireRole("participant"), teamSuggestions);

