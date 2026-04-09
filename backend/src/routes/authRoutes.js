import express from "express";
import { login, me, refresh, signup } from "../controllers/authController.js";
import { attachUser, requireAuth } from "../middleware/auth.js";

export const authRoutes = express.Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/refresh", refresh);
authRoutes.get("/me", requireAuth, attachUser, me);

