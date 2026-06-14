import type { Request, Response, NextFunction } from "express";
import { COOKIE_NAME, verifySessionToken } from "../lib/session";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!verifySessionToken(req.cookies?.[COOKIE_NAME])) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
