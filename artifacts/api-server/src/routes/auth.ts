import { Router, type IRouter } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminMeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const COOKIE_NAME = "nepal_admin_session";
const COOKIE_SECRET = "nepal-league-admin-2026";

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

  res.cookie(COOKIE_NAME, COOKIE_SECRET, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json(AdminLoginResponse.parse({ isAdmin: true, username }));
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const session = req.cookies?.[COOKIE_NAME];
  if (session !== COOKIE_SECRET) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(GetAdminMeResponse.parse({ isAdmin: true, username: ADMIN_USERNAME }));
});

export default router;
