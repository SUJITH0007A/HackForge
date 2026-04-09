import express from "express";
import { attachUser, requireAuth, requireRole } from "../middleware/auth.js";
import {
  createEvent,
  deleteEvent,
  getEvent,
  getPublicEvent,
  listPublishedEvents,
  updateEvent
} from "../controllers/eventController.js";

export const eventRoutes = express.Router();

eventRoutes.get("/", listPublishedEvents);
eventRoutes.get("/:eventId", requireAuth, attachUser, getEvent);
eventRoutes.get("/:eventId/public", getPublicEvent);

eventRoutes.post("/", requireAuth, requireRole("admin"), createEvent);
eventRoutes.patch("/:eventId", requireAuth, requireRole("admin"), updateEvent);
eventRoutes.delete("/:eventId", requireAuth, requireRole("admin"), deleteEvent);

