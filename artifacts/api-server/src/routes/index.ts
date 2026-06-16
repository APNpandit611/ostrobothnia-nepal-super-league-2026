import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/requireAuth";
import healthRouter from "./health";
import authRouter from "./auth";
import teamsRouter from "./teams";
import matchesRouter from "./matches";
import goalsRouter from "./goals";
import cardsRouter from "./cards";
import matchEventsRouter from "./matchEvents";
import standingsRouter from "./standings";
import statsRouter from "./stats";
import tournamentRouter from "./tournament";
import tournamentInfoRouter from "./tournamentInfo";
import playersRouter from "./players";
import otpRouter from "./otp";
import announcementsRouter from "./announcements";
import clubApplicationsRouter from "./clubApplications";
import clubSettingsRouter from "./clubSettings";
import seasonArchivesRouter from "./seasonArchives";
import storageRouter from "./storage";

const router: IRouter = Router();

// Public paths that allow writes without a session
const PUBLIC_WRITE = [
  "/auth/login",
  "/auth/logout",
];
const PUBLIC_WRITE_PREFIX = [
  "/register",
  "/otp/",
];

// Protect all state-mutating requests with a session check.
// GET / HEAD / OPTIONS are public (read-only) EXCEPT under /admin, whose reads
// can expose PII (applications) or unpublished content and so always require a
// session. Public write paths (login, registration, OTP, club applications)
// remain exempt.
router.use((req: Request, res: Response, next: NextFunction): void => {
  // Admin endpoints always require a session — including reads.
  if (req.path === "/admin" || req.path.startsWith("/admin/")) {
    requireAuth(req, res, next);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  if (PUBLIC_WRITE.includes(req.path)) return next();
  if (PUBLIC_WRITE_PREFIX.some(p => req.path.startsWith(p))) return next();
  // Public: anyone can submit a club membership application
  if (req.path === "/club-applications" && req.method === "POST") return next();
  requireAuth(req, res, next);
});

router.use(healthRouter);
router.use(authRouter);
router.use(teamsRouter);
router.use(matchesRouter);
router.use(goalsRouter);
router.use(cardsRouter);
router.use(matchEventsRouter);
router.use(standingsRouter);
router.use(statsRouter);
router.use(tournamentRouter);
router.use(tournamentInfoRouter);
router.use(playersRouter);
router.use(otpRouter);
router.use(announcementsRouter);
router.use(clubApplicationsRouter);
router.use(clubSettingsRouter);
router.use(seasonArchivesRouter);
router.use(storageRouter);

export default router;
