import mongoose from "mongoose";
import { Evaluation } from "../models/Evaluation.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { JudgeAssignment } from "../models/JudgeAssignment.js";

export async function leaderboard(req, res, next) {
  try {
    const eventIdObj = new mongoose.Types.ObjectId(req.params.eventId);

    const agg = await Evaluation.aggregate([
      { $match: { eventId: eventIdObj } },
      {
        $group: {
          _id: "$teamId",
          avgScore: { $avg: "$totalScore" },
          judgeCount: { $sum: 1 }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    const teamIds = agg.map((a) => a._id);
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamById = new Map(teams.map((t) => [String(t._id), t]));

    const memberIds = [...new Set(teams.flatMap((t) => t.memberUserIds.map((id) => String(id))))];
    const members = await User.find({ _id: { $in: memberIds } }).lean();
    const memberById = new Map(members.map((u) => [String(u._id), u]));

    const rows = agg.map((a, idx) => {
      const t = teamById.get(String(a._id));
      return {
        rank: idx + 1,
        team: t
          ? {
              id: String(t._id),
              name: t.name,
              size: t.memberUserIds.length,
              members: t.memberUserIds.map((id) => {
                const u = memberById.get(String(id));
                return { id: String(id), fullName: u?.participantProfile?.fullName ?? "", college: u?.participantProfile?.college ?? "" };
              })
            }
          : { id: String(a._id), name: "Unknown", size: 0, members: [] },
        avgScore: Math.round(a.avgScore * 100) / 100,
        judgeCount: a.judgeCount
      };
    });

    res.json({ leaderboard: rows });
  } catch (err) {
    next(err);
  }
}

export async function judgeCoverage(req, res, next) {
  try {
    const assignments = await JudgeAssignment.find({ eventId: req.params.eventId }).lean();
    const byTeam = new Map();
    for (const a of assignments) {
      const k = String(a.teamId);
      byTeam.set(k, (byTeam.get(k) ?? 0) + 1);
    }
    res.json({ coverage: Object.fromEntries(byTeam.entries()) });
  } catch (err) {
    next(err);
  }
}

