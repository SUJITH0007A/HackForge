import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetRoles: { type: [String], enum: ["admin", "participant", "judge"], default: ["participant", "judge"] }
  },
  { timestamps: true }
);

AnnouncementSchema.index({ eventId: 1, createdAt: -1 });

export const Announcement = mongoose.model("Announcement", AnnouncementSchema);

