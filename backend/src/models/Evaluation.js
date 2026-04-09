import mongoose from "mongoose";

const EvaluationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    judgeUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Map of rubricKey -> score (0..10)
    scores: { type: Map, of: Number, default: () => new Map() },
    remarks: { type: String, default: "" },
    totalScore: { type: Number, required: true, default: 0, index: true },

    submittedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

EvaluationSchema.index({ eventId: 1, teamId: 1, judgeUserId: 1 }, { unique: true });

export const Evaluation = mongoose.model("Evaluation", EvaluationSchema);

