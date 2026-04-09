import mongoose from "mongoose";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { Submission } from "../models/Submission.js";
import { JudgeAssignment } from "../models/JudgeAssignment.js";
import { badRequest, notFound } from "../utils/httpError.js";
import { emitToEvent } from "../services/realtimeHub.js";

function top(map, n = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, value]) => ({ key, value }));
}

export async function overview(req, res, next) {
  try {
    const eventId = req.params.eventId;
    const [event, registrations, teams, submissions] = await Promise.all([
      Event.findById(eventId).lean(),
      Registration.countDocuments({ eventId, status: "registered" }),
      Team.countDocuments({ eventId }),
      Submission.countDocuments({ eventId, submittedAt: { $ne: null } })
    ]);

    if (!event) throw notFound("Event not found");
    res.json({ event, counters: { registrations, teams, submissions } });
  } catch (err) {
    next(err);
  }
}

export async function analytics(req, res, next) {
  try {
    const eventId = new mongoose.Types.ObjectId(req.params.eventId);
    const regs = await Registration.aggregate([
      { $match: { eventId, status: "registered" } },
      {
        $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "u" }
      },
      { $unwind: "$u" },
      {
        $project: {
          createdAt: 1,
          college: "$u.participantProfile.college",
          department: "$u.participantProfile.department",
          year: "$u.participantProfile.year",
          skills: "$u.participantProfile.skills"
        }
      }
    ]);

    const byCollege = new Map();
    const byDept = new Map();
    const byYear = new Map();
    const skillCounts = new Map();
    const trend = new Map();

    for (const r of regs) {
      const college = (r.college ?? "Unknown").trim() || "Unknown";
      const dept = (r.department ?? "Unknown").trim() || "Unknown";
      const year = r.year ? String(r.year) : "Unknown";
      byCollege.set(college, (byCollege.get(college) ?? 0) + 1);
      byDept.set(dept, (byDept.get(dept) ?? 0) + 1);
      byYear.set(year, (byYear.get(year) ?? 0) + 1);

      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      trend.set(key, (trend.get(key) ?? 0) + 1);

      for (const s of r.skills ?? []) {
        const k = String(s).toLowerCase().trim();
        if (!k) continue;
        skillCounts.set(k, (skillCounts.get(k) ?? 0) + 1);
      }
    }

    res.json({
      byCollege: top(byCollege, 12),
      byDepartment: top(byDept, 12),
      byYear: top(byYear, 10),
      skillDistribution: top(skillCounts, 20),
      registrationTrend: [...trend.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }))
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const role = req.query.role;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function assignJudge(req, res, next) {
  try {
    const { eventId, teamId } = req.params;
    const judgeUserId = req.body?.judgeUserId;
    if (!judgeUserId) throw badRequest("judgeUserId is required");

    const [event, team, judge] = await Promise.all([
      Event.findById(eventId).lean(),
      Team.findOne({ _id: teamId, eventId }).lean(),
      User.findById(judgeUserId).lean()
    ]);
    if (!event) throw notFound("Event not found");
    if (!team) throw notFound("Team not found");
    if (!judge || judge.role !== "judge") throw badRequest("Invalid judge user");

    const doc = await JudgeAssignment.findOneAndUpdate(
      { eventId, teamId, judgeUserId },
      { $setOnInsert: { assignedByUserId: req.auth.sub } },
      { upsert: true, new: true }
    );

    emitToEvent(eventId, "judge:assigned", { eventId, teamId, judgeUserId });
    res.status(201).json({ assignment: doc });
  } catch (err) {
    next(err);
  }
}

