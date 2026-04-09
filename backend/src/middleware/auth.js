import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { forbidden, unauthorized } from "../utils/httpError.js";
import { User } from "../models/User.js";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return next(unauthorized("Missing access token"));
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.auth = payload;
    return next();
  } catch {
    return next(unauthorized("Invalid or expired access token"));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role) return next(unauthorized("Missing auth context"));
    if (!roles.includes(role)) return next(forbidden("Insufficient permissions"));
    return next();
  };
}

export async function attachUser(req, res, next) {
  const userId = req.auth?.sub;
  if (!userId) return next(unauthorized("Missing auth subject"));
  const user = await User.findById(userId).lean();
  if (!user || !user.isActive) return next(unauthorized("User inactive"));
  req.user = user;
  next();
}

