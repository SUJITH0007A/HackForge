import { z } from "zod";
import { Event } from "../models/Event.js";
import { parseOr400 } from "../utils/zod.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";

const criteriaSchema = z.array(
  z.object({
    key: z.string().min(2).max(40),
    label: z.string().min(2).max(60),
    weight: z.number().min(0).max(100)
  })
);

const createEventSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(8000),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  eventType: z.enum(["hackathon", "datathon", "workshop", "contest"]),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  registrationDeadlineAt: z.string().datetime(),
  submissionDeadlineAt: z.string().datetime(),
  maxTeamSize: z.number().int().min(1).max(10),
  rules: z.string().max(12000).optional(),
  instructions: z.string().max(12000).optional(),
  judgingCriteria: criteriaSchema.optional(),
  isPublished: z.boolean().optional()
});

const updateEventSchema = createEventSchema.partial();

export async function listPublishedEvents(req, res, next) {
  try {
    const now = new Date();
    const events = await Event.find({ isPublished: true }).sort({ startAt: 1 }).lean();
    // Keep returned set reasonably small; clients can paginate later if needed
    res.json({ events });
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.eventId).lean();
    if (!event) throw notFound("Event not found");
    if (!event.isPublished && req.user?.role !== "admin") throw forbidden("Event is not published");
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

export async function getPublicEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.eventId).lean();
    if (!event) return res.status(404).json({ error: { message: "Event not found" } });
    if (!event.isPublished) return res.status(403).json({ error: { message: "Event not published" } });
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req, res, next) {
  try {
    const input = parseOr400(createEventSchema, req.body);
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    const regDl = new Date(input.registrationDeadlineAt);
    const subDl = new Date(input.submissionDeadlineAt);

    if (!(startAt < endAt)) throw badRequest("startAt must be before endAt");
    if (!(regDl <= startAt)) throw badRequest("registrationDeadlineAt must be before startAt");
    if (!(subDl <= endAt)) throw badRequest("submissionDeadlineAt must be before endAt");

    const judgingCriteria = input.judgingCriteria ?? [];
    const totalWeight = judgingCriteria.reduce((a, c) => a + c.weight, 0);
    if (judgingCriteria.length && Math.abs(totalWeight - 100) > 0.001) {
      throw badRequest("Judging criteria weights must sum to 100");
    }

    const event = await Event.create({
      title: input.title,
      description: input.description,
      banner: { url: input.bannerUrl ?? "", publicId: "" },
      eventType: input.eventType,
      startAt,
      endAt,
      registrationDeadlineAt: regDl,
      submissionDeadlineAt: subDl,
      maxTeamSize: input.maxTeamSize,
      rules: input.rules ?? "",
      instructions: input.instructions ?? "",
      judgingCriteria,
      isPublished: input.isPublished ?? false,
      createdBy: req.auth.sub
    });

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const input = parseOr400(updateEventSchema, req.body);
    const event = await Event.findById(req.params.eventId);
    if (!event) throw notFound("Event not found");

    if (typeof input.title === "string") event.title = input.title;
    if (typeof input.description === "string") event.description = input.description;
    if (typeof input.bannerUrl === "string") event.banner.url = input.bannerUrl;
    if (typeof input.eventType === "string") event.eventType = input.eventType;
    if (typeof input.rules === "string") event.rules = input.rules;
    if (typeof input.instructions === "string") event.instructions = input.instructions;
    if (typeof input.maxTeamSize === "number") event.maxTeamSize = input.maxTeamSize;
    if (typeof input.isPublished === "boolean") event.isPublished = input.isPublished;

    if (input.judgingCriteria) {
      const totalWeight = input.judgingCriteria.reduce((a, c) => a + c.weight, 0);
      if (input.judgingCriteria.length && Math.abs(totalWeight - 100) > 0.001) {
        throw badRequest("Judging criteria weights must sum to 100");
      }
      event.judgingCriteria = input.judgingCriteria;
    }

    if (input.startAt) event.startAt = new Date(input.startAt);
    if (input.endAt) event.endAt = new Date(input.endAt);
    if (input.registrationDeadlineAt) event.registrationDeadlineAt = new Date(input.registrationDeadlineAt);
    if (input.submissionDeadlineAt) event.submissionDeadlineAt = new Date(input.submissionDeadlineAt);

    await event.save();
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) throw notFound("Event not found");
    await event.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

