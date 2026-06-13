import { Router, type IRouter } from "express";
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
import playersRouter from "./players";
import otpRouter from "./otp";

const router: IRouter = Router();

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
router.use(playersRouter);
router.use(otpRouter);

export default router;
