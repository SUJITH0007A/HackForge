import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getMySubmission, upsertMySubmission } from "../controllers/submissionController.js";

export const submissionRoutes = express.Router();

submissionRoutes.get("/events/:eventId/my", requireAuth, requireRole("participant"), getMySubmission);
submissionRoutes.put("/events/:eventId/my", requireAuth, requireRole("participant"), upsertMySubmission);

