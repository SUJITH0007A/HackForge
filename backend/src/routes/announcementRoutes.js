import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createAnnouncement, listAnnouncements, myNotifications } from "../controllers/announcementController.js";

export const announcementRoutes = express.Router();

announcementRoutes.get("/events/:eventId/announcements", requireAuth, listAnnouncements);
announcementRoutes.post("/announcements", requireAuth, requireRole("admin"), createAnnouncement);
announcementRoutes.get("/me/notifications", requireAuth, myNotifications);

