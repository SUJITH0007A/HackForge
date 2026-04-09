import express from "express";
import { leaderboard, judgeCoverage } from "../controllers/leaderboardController.js";

export const leaderboardRoutes = express.Router();

leaderboardRoutes.get("/events/:eventId/leaderboard", leaderboard);
leaderboardRoutes.get("/events/:eventId/judge-coverage", judgeCoverage);

