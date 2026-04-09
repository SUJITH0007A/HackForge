import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null, index: true },
    status: { type: String, enum: ["registered", "waitlisted", "cancelled"], default: "registered", index: true }
  },
  { timestamps: true }
);

RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Registration = mongoose.model("Registration", RegistrationSchema);

