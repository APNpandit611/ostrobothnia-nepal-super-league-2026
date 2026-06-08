import { Router, type IRouter } from "express";
import { db, matchesTable, goalsTable, cardsTable, matchEventsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/tournament/reset", async (_req, res): Promise<void> => {
  await db.delete(matchEventsTable);
  await db.delete(goalsTable);
  await db.delete(cardsTable);
  await db.delete(matchesTable);
  res.json({ message: "Tournament reset successfully" });
});

export default router;
