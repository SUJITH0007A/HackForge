import express from "express";
import { requireAuth, requireRole, attachUser } from "../middleware/auth.js";
import { getAssignedSubmission, getJudgingCriteria, leaderboardSnapshotForJudge, myAssignedTeams, submitScore } from "../controllers/judgeController.js";

export const judgeRoutes = express.Router();

judgeRoutes.get("/events/:eventId/assigned-teams", requireAuth, requireRole("judge"), myAssignedTeams);
judgeRoutes.get("/events/:eventId/teams/:teamId/submission", requireAuth, requireRole("judge"), getAssignedSubmission);
judgeRoutes.put("/events/:eventId/teams/:teamId/score", requireAuth, requireRole("judge"), submitScore);

judgeRoutes.get("/events/:eventId/criteria", requireAuth, requireRole("judge"), attachUser, getJudgingCriteria);

// helper (not used by frontend yet)
judgeRoutes.get("/events/:eventId/leaderboard-snapshot", requireAuth, requireRole("judge"), leaderboardSnapshotForJudge);

