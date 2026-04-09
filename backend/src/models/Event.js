import mongoose from "mongoose";

const JudgingCriterionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true }, // rubric key
    label: { type: String, required: true, trim: true }, // UI label
    weight: { type: Number, required: true, min: 0, max: 100 }
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    banner: { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
    eventType: { type: String, enum: ["hackathon", "datathon", "workshop", "contest"], required: true, index: true },

    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    registrationDeadlineAt: { type: Date, required: true, index: true },
    submissionDeadlineAt: { type: Date, required: true, index: true },

    maxTeamSize: { type: Number, required: true, min: 1, max: 10, default: 4 },

    rules: { type: String, default: "" },
    instructions: { type: String, default: "" },

    judgingCriteria: { type: [JudgingCriterionSchema], default: [] },
    isPublished: { type: Boolean, default: false, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", EventSchema);

