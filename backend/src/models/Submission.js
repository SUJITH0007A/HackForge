import mongoose from "mongoose";

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
    filename: { type: String, default: "" }
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },

    projectTitle: { type: String, required: true, trim: true },
    projectDescription: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    demoUrl: { type: String, default: "" },
    presentationUrl: { type: String, default: "" },
    attachment: { type: AttachmentSchema, default: () => ({}) },

    submittedAt: { type: Date, default: null },
    isLocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

SubmissionSchema.index({ eventId: 1, teamId: 1 }, { unique: true });

export const Submission = mongoose.model("Submission", SubmissionSchema);

