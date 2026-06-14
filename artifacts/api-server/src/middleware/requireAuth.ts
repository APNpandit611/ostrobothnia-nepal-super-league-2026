import type { Request, Response, NextFunction } from "express";

const COOKIE_NAME = "nepal_admin_session";
const COOKIE_SECRET = "nepal-league-admin-2026";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = req.cookies?.[COOKIE_NAME];
  if (session !== COOKIE_SECRET) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
