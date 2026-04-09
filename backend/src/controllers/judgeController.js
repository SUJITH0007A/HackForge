import { z } from "zod";
import mongoose from "mongoose";
import { Event } from "../models/Event.js";
import { Evaluation } from "../models/Evaluation.js";
import { JudgeAssignment } from "../models/JudgeAssignment.js";
import { Submission } from "../models/Submission.js";
import { Team } from "../models/Team.js";
import { parseOr400 } from "../utils/zod.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";
import { emitToEvent, emitToUser } from "../services/realtimeHub.js";

export async function myAssignedTeams(req, res, next) {
  try {
    const { eventId } = req.params;
    const judgeUserId = req.auth.sub;

    const assignments = await JudgeAssignment.find({ eventId, judgeUserId }).lean();
    const teamIds = assignments.map((a) => a.teamId);
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    res.json({ teams });
  } catch (err) {
    next(err);
  }
}

export async function getAssignedSubmission(req, res, next) {
  try {
    const { eventId, teamId } = req.params;
    const judgeUserId = req.auth.sub;

    const assignment = await JudgeAssignment.findOne({ eventId, teamId, judgeUserId }).lean();
    if (!assignment) throw forbidden("Not assigned to this team");

    const submission = await Submission.findOne({ eventId, teamId }).lean();
    res.json({ submission: submission ?? null });
  } catch (err) {
    next(err);
  }
}

const scoreSchema = z.object({
  scores: z.record(z.string().min(2).max(40), z.number().min(0).max(10)),
  remarks: z.string().max(3000).optional()
});

function computeWeightedTotal(event, scoresMap) {
  const criteria = event.judgingCriteria ?? [];
  if (!criteria.length) return 0;

  let total = 0;
  for (const c of criteria) {
    const raw = Number(scoresMap?.[c.key] ?? 0);
    const clamped = Math.max(0, Math.min(10, raw));
    total += (clamped / 10) * (c.weight ?? 0);
  }

  return Math.round(total * 100) / 100; // 0..100
}

export async function getJudgingCriteria(req, res, next) {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).lean();
    if (!event) throw notFound("Event not found");
    if (!event.isPublished && req.user?.role !== "admin" && req.auth?.role !== "judge") {
      throw forbidden("Event not published");
    }
    res.json({ judgingCriteria: event.judgingCriteria ?? [] });
  } catch (err) {
    next(err);
  }
}

export async function submitScore(req, res, next) {
  try {
    const { eventId, teamId } = req.params;
    const judgeUserId = req.auth.sub;
    const input = parseOr400(scoreSchema, req.body);

    const assignment = await JudgeAssignment.findOne({ eventId, teamId, judgeUserId }).lean();
    if (!assignment) throw forbidden("Not assigned to this team");

    const event = await Event.findById(eventId).lean();
    if (!event) throw notFound("Event not found");
    if (!event.judgingCriteria?.length) throw badRequest("Judging criteria not configured");

    const submission = await Submission.findOne({ eventId, teamId }).lean();
    if (!submission?.submittedAt) throw badRequest("No valid submission found");

    const existing = await Evaluation.findOne({ eventId, teamId, judgeUserId }).lean();
    if (existing?.submittedAt) throw badRequest("Score already submitted for this team");

    const totalScore = computeWeightedTotal(event, input.scores);

    const evaluation = await Evaluation.findOneAndUpdate(
      { eventId, teamId, judgeUserId },
      {
        $set: {
          scores: input.scores,
          remarks: input.remarks ?? "",
          totalScore,
          submittedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    emitToEvent(eventId, "leaderboard:dirty", { eventId });
    emitToUser(judgeUserId, "judge:score:submitted", { eventId, teamId, totalScore });
    res.json({ evaluation });
  } catch (err) {
    next(err);
  }
}

export async function leaderboardSnapshotForJudge(req, res, next) {
  // Optional helper; not wired on frontend yet
  try {
    const eventId = req.params.eventId;
    const eventObjId = new mongoose.Types.ObjectId(eventId);
    const rows = await Evaluation.aggregate([
      { $match: { eventId: eventObjId } },
      { $group: { _id: "$teamId", avgScore: { $avg: "$totalScore" }, judgeCount: { $sum: 1 } } },
      { $sort: { avgScore: -1 } }
    ]);
    res.json({ rows });
  } catch (err) {
    next(err);
  }
}

