import { z } from "zod";
import { Announcement } from "../models/Announcement.js";
import { Notification } from "../models/Notification.js";
import { Registration } from "../models/Registration.js";
import { JudgeAssignment } from "../models/JudgeAssignment.js";
import { parseOr400 } from "../utils/zod.js";
import { emitToEvent, emitToUser } from "../services/realtimeHub.js";

const createSchema = z.object({
  eventId: z.string().min(10),
  title: z.string().min(3).max(120),
  message: z.string().min(5).max(6000),
  targetRoles: z.array(z.enum(["participant", "judge", "admin"])).min(1).max(3).optional()
});

export async function createAnnouncement(req, res, next) {
  try {
    const input = parseOr400(createSchema, req.body);

    const announcement = await Announcement.create({
      eventId: input.eventId,
      title: input.title,
      message: input.message,
      createdByUserId: req.auth.sub,
      targetRoles: input.targetRoles ?? ["participant", "judge"]
    });

    const targets = new Set();
    if ((announcement.targetRoles ?? []).includes("participant")) {
      const regs = await Registration.find({ eventId: input.eventId, status: "registered" }).lean();
      for (const r of regs) targets.add(String(r.userId));
    }
    if ((announcement.targetRoles ?? []).includes("judge")) {
      const assigns = await JudgeAssignment.find({ eventId: input.eventId }).lean();
      for (const a of assigns) targets.add(String(a.judgeUserId));
    }
    // Admin fan-out intentionally omitted (admins can use audit/overview feeds)

    if (targets.size) {
      const now = new Date();
      const docs = [...targets].map((userId) => ({
        userId,
        eventId: input.eventId,
        type: "announcement",
        title: input.title,
        message: input.message,
        createdAt: now,
        updatedAt: now
      }));
      await Notification.insertMany(docs, { ordered: false });
    }

    emitToEvent(input.eventId, "announcement:new", {
      eventId: input.eventId,
      announcement: {
        id: String(announcement._id),
        title: announcement.title,
        message: announcement.message,
        createdAt: announcement.createdAt
      }
    });
    for (const userId of targets) emitToUser(userId, "notification:new", { eventId: input.eventId });

    res.status(201).json({ announcement });
  } catch (err) {
    next(err);
  }
}

export async function listAnnouncements(req, res, next) {
  try {
    const items = await Announcement.find({ eventId: req.params.eventId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ announcements: items });
  } catch (err) {
    next(err);
  }
}

export async function myNotifications(req, res, next) {
  try {
    const items = await Notification.find({ userId: req.auth.sub }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ notifications: items });
  } catch (err) {
    next(err);
  }
}

