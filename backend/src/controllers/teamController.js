import { z } from "zod";
import { nanoid } from "nanoid";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Team } from "../models/Team.js";
import { parseOr400 } from "../utils/zod.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";
import { suggestTeammates, suggestTeamsForUser } from "../services/teamMatcher.js";
import { emitToEvent } from "../services/realtimeHub.js";

const createTeamSchema = z.object({
  eventId: z.string().min(10),
  teamName: z.string().min(3).max(60)
});

const joinTeamSchema = z.object({
  eventId: z.string().min(10),
  joinCode: z.string().min(4).max(20)
});

export async function registerForEvent(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.auth.sub;

    const event = await Event.findById(eventId).lean();
    if (!event) throw notFound("Event not found");
    if (!event.isPublished) throw forbidden("Event not published");
    if (new Date() > new Date(event.registrationDeadlineAt)) throw badRequest("Registration closed");

    const reg = await Registration.findOneAndUpdate(
      { eventId, userId },
      { $setOnInsert: { status: "registered" } },
      { upsert: true, new: true }
    );

    emitToEvent(eventId, "registration:counter", { eventId });
    res.status(201).json({ registration: reg });
  } catch (err) {
    next(err);
  }
}

export async function createTeam(req, res, next) {
  try {
    const input = parseOr400(createTeamSchema, req.body);
    const userId = req.auth.sub;

    const event = await Event.findById(input.eventId).lean();
    if (!event) throw notFound("Event not found");
    if (!event.isPublished) throw forbidden("Event not published");
    if (new Date() > new Date(event.registrationDeadlineAt)) throw badRequest("Registration closed");

    const reg = await Registration.findOne({ eventId: input.eventId, userId, status: "registered" });
    if (!reg) throw forbidden("You must be registered for this event");
    if (reg.teamId) throw badRequest("You are already in a team");

    const teamName = input.teamName.trim();
    const joinCode = nanoid(8).toUpperCase();

    const team = await Team.create({
      eventId: input.eventId,
      name: teamName,
      joinCode,
      createdByUserId: userId,
      memberUserIds: [userId],
      maxSize: event.maxTeamSize
    });

    reg.teamId = team._id;
    await reg.save();

    emitToEvent(input.eventId, "team:created", { eventId: input.eventId });
    res.status(201).json({ team });
  } catch (err) {
    // handle unique constraint conflicts
    if (String(err?.code) === "11000") return next(badRequest("Team name or join code already exists"));
    next(err);
  }
}

export async function joinTeam(req, res, next) {
  try {
    const input = parseOr400(joinTeamSchema, req.body);
    const userId = req.auth.sub;

    const event = await Event.findById(input.eventId).lean();
    if (!event) throw notFound("Event not found");
    if (!event.isPublished) throw forbidden("Event not published");
    if (new Date() > new Date(event.registrationDeadlineAt)) throw badRequest("Registration closed");

    const reg = await Registration.findOne({ eventId: input.eventId, userId, status: "registered" });
    if (!reg) throw forbidden("You must be registered for this event");
    if (reg.teamId) throw badRequest("You are already in a team");

    const team = await Team.findOne({ eventId: input.eventId, joinCode: input.joinCode }).exec();
    if (!team) throw notFound("Invalid join code");
    if (team.isLocked) throw badRequest("Team is locked");
    if (team.memberUserIds.length >= team.maxSize) throw badRequest("Team is full");
    if (team.memberUserIds.some((id) => String(id) === String(userId))) throw badRequest("Already a member");

    team.memberUserIds.push(userId);
    await team.save();

    reg.teamId = team._id;
    await reg.save();

    emitToEvent(input.eventId, "team:updated", { eventId: input.eventId });
    res.json({ team });
  } catch (err) {
    next(err);
  }
}

export async function myTeam(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.auth.sub;

    const reg = await Registration.findOne({ eventId, userId, status: "registered" }).lean();
    if (!reg) throw notFound("Not registered");
    if (!reg.teamId) return res.json({ team: null });

    const team = await Team.findById(reg.teamId).lean();
    res.json({ team });
  } catch (err) {
    next(err);
  }
}

export async function teammateSuggestions(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.auth.sub;

    const reg = await Registration.findOne({ eventId, userId, status: "registered" }).lean();
    if (!reg?.teamId) throw badRequest("Join or create a team first");

    const suggestions = await suggestTeammates({ eventId, teamId: reg.teamId, limit: 8 });
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}

export async function teamSuggestions(req, res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.auth.sub;

    const suggestions = await suggestTeamsForUser({ eventId, userId, limit: 6 });
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}

