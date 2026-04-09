import mongoose from "mongoose";

const JudgeAssignmentSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    judgeUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

JudgeAssignmentSchema.index({ eventId: 1, teamId: 1, judgeUserId: 1 }, { unique: true });

export const JudgeAssignment = mongoose.model("JudgeAssignment", JudgeAssignmentSchema);

