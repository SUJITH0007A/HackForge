import { z } from "zod";
import { User } from "../models/User.js";
import { parseOr400 } from "../utils/zod.js";
import { badRequest, notFound, unauthorized } from "../utils/httpError.js";
import { hashPassword, verifyPassword } from "../services/passwords.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/tokens.js";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["admin", "participant", "judge"]).default("participant"),
  fullName: z.string().min(2).max(80),
  phone: z.string().max(30).optional(),
  college: z.string().max(120).optional(),
  department: z.string().max(120).optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
  skills: z.array(z.string().min(1).max(40)).max(25).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  links: z
    .object({
      github: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      portfolio: z.string().url().optional().or(z.literal(""))
    })
    .optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export async function signup(req, res, next) {
  try {
    const input = parseOr400(signupSchema, req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) throw badRequest("Email already in use");

    const passwordHash = await hashPassword(input.password);

    let participantProfile = null;
    let judgeProfile = null;

    if (input.role === "participant") {
      participantProfile = {
        fullName: input.fullName,
        phone: input.phone ?? "",
        college: input.college ?? "",
        department: input.department ?? "",
        year: input.year,
        skills: input.skills ?? [],
        experienceLevel: input.experienceLevel ?? "beginner",
        links: input.links ?? {}
      };
    } else if (input.role === "judge") {
      judgeProfile = { fullName: input.fullName, organization: "", title: "" };
    }

    const user = await User.create({
      email: input.email,
      passwordHash,
      role: input.role,
      participantProfile,
      judgeProfile
    });

    res.status(201).json({
      user: { id: String(user._id), email: user.email, role: user.role },
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user)
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const input = parseOr400(loginSchema, req.body);
    const user = await User.findOne({ email: input.email });
    if (!user || !user.isActive) throw unauthorized("Invalid credentials");

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw unauthorized("Invalid credentials");

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      user: { id: String(user._id), email: user.email, role: user.role },
      accessToken: signAccessToken(user),
      refreshToken: signRefreshToken(user)
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const input = parseOr400(refreshSchema, req.body);
    const payload = verifyRefreshToken(input.refreshToken);

    const user = await User.findById(payload.sub).lean();
    if (!user || !user.isActive) throw unauthorized("Invalid refresh token");

    res.json({ accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) });
  } catch {
    next(unauthorized("Invalid refresh token"));
  }
}

export async function me(req, res) {
  const u = req.user;
  res.json({
    user: {
      id: String(u._id),
      email: u.email,
      role: u.role,
      participantProfile: u.participantProfile,
      judgeProfile: u.judgeProfile,
      createdAt: u.createdAt
    }
  });
}

