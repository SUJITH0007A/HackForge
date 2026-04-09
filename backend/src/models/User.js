import mongoose from "mongoose";

const LinkSchema = new mongoose.Schema(
  {
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" }
  },
  { _id: false }
);

const ParticipantProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    college: { type: String, default: "", trim: true },
    department: { type: String, default: "", trim: true },
    year: { type: Number, min: 1, max: 6 },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 25,
        message: "Too many skills"
      }
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    links: { type: LinkSchema, default: () => ({}) }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "participant", "judge"], default: "participant", index: true },

    participantProfile: { type: ParticipantProfileSchema, default: null },
    judgeProfile: {
      type: new mongoose.Schema(
        {
          fullName: { type: String, required: true, trim: true },
          organization: { type: String, default: "", trim: true },
          title: { type: String, default: "", trim: true }
        },
        { _id: false }
      ),
      default: null
    },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);

