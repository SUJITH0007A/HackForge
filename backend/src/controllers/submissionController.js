import { z } from "zod";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Submission } from "../models/Submission.js";
import { Team } from "../models/Team.js";
import { parseOr400 } from "../utils/zod.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";
import { emitToEvent } from "../services/realtimeHub.js";

const upsertSchema = z.object({
  projectTitle: z.string().min(3).max(120),
  projectDescription: z.string().max(8000).optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  demoUrl: z.string().url().optional().or(z.literal("")),
  presentationUrl: z.string().url().optional().or(z.literal("")),
  attachment: z
    .object({
      url: z.string().optional().or(z.literal("")),
      publicId: z.string().optional().or(z.literal("")),
      filename: z.string().optional().or(z.literal(""))
    })
    .optional()
});

function nowMs() {
  return Date.now();
}

export async function upsertMySubmission(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.auth.sub;
    const input = parseOr400(upsertSchema, req.body);

    const event = await Event.findById(eventId).lean();
    if (!event) throw notFound("Event not found");
    if (!event.isPublished) throw forbidden("Event not published");

    const reg = await Registration.findOne({ eventId, userId, status: "registered" }).lean();
    if (!reg?.teamId) throw badRequest("You must be in a team to submit");

    const team = await Team.findById(reg.teamId).lean();
    if (!team) throw notFound("Team not found");

    const deadline = new Date(event.submissionDeadlineAt).getTime();
    const isPastDeadline = nowMs() > deadline;

    const existing = await Submission.findOne({ eventId, teamId: team._id });
    if (existing?.isLocked) throw badRequest("Submission is locked");

    if (isPastDeadline) {
      // Lock it permanently once deadline has passed.
      if (existing) {
        existing.isLocked = true;
        await existing.save();
      } else {
        await Submission.create({
          eventId,
          teamId: team._id,
          projectTitle: input.projectTitle,
          projectDescription: input.projectDescription ?? "",
          githubUrl: input.githubUrl ?? "",
          demoUrl: input.demoUrl ?? "",
          presentationUrl: input.presentationUrl ?? "",
          attachment: input.attachment ?? {},
          submittedAt: null,
          isLocked: true
        });
      }
      throw badRequest("Submission deadline passed");
    }

    const now = new Date();
    const submission = await Submission.findOneAndUpdate(
      { eventId, teamId: team._id },
      {
        $set: {
          projectTitle: input.projectTitle,
          projectDescription: input.projectDescription ?? "",
          githubUrl: input.githubUrl ?? "",
          demoUrl: input.demoUrl ?? "",
          presentationUrl: input.presentationUrl ?? "",
          attachment: input.attachment ?? {},
          submittedAt: now,
          isLocked: false
        }
      },
      { upsert: true, new: true }
    );

    emitToEvent(eventId, "submission:updated", { eventId, teamId: String(team._id) });
    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

export async function getMySubmission(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.auth.sub;

    const reg = await Registration.findOne({ eventId, userId, status: "registered" }).lean();
    if (!reg?.teamId) return res.json({ submission: null });

    const submission = await Submission.findOne({ eventId, teamId: reg.teamId }).lean();
    res.json({ submission: submission ?? null });
  } catch (err) {
    next(err);
  }
}

