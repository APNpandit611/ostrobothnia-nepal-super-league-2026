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

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Ksoccerboys@1995!";

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
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
