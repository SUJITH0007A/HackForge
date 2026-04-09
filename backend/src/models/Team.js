import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    name: { type: String, required: true, trim: true },
    joinCode: { type: String, required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    memberUserIds: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    maxSize: { type: Number, required: true, min: 1, max: 10 },
    isLocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

TeamSchema.index({ eventId: 1, name: 1 }, { unique: true });
TeamSchema.index({ eventId: 1, joinCode: 1 }, { unique: true });

export const Team = mongoose.model("Team", TeamSchema);

