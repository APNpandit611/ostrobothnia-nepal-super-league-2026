import { Router, type IRouter } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminMeResponse,
} from "@workspace/api-zod";
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE_MS,
  createSessionToken,
  verifySessionToken,
} from "../lib/session";

const router: IRouter = Router();

// Admin credentials come from the environment so they are never committed to
// source (the repo is intended to be pushed to a public GitHub remote).
// Username defaults to "admin"; the password MUST be provided via ADMIN_PASSWORD.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD is not configured");
    res.status(503).json({ error: "Admin login is not configured" });
    return;
  }

  const { username, password } = parsed.data;
  if (username !== ADMIN_USERNAME || password !== adminPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.cookie(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_MS,
  });

  res.json(AdminLoginResponse.parse({ isAdmin: true, username }));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!verifySessionToken(req.cookies?.[COOKIE_NAME])) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(GetAdminMeResponse.parse({ isAdmin: true, username: ADMIN_USERNAME }));
});

export default router;
