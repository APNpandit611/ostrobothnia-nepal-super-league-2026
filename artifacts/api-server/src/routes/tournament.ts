import { Router, type IRouter } from "express";
import { db, matchesTable, goalsTable, cardsTable, matchEventsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/tournament/reset", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };
  if (password !== process.env["RESET_PASSWORD"] && password !== "Ksoccerboys@1995!") {
    res.status(403).json({ message: "Incorrect password" });
    return;
  }
  await db.delete(matchEventsTable);
  await db.delete(goalsTable);
  await db.delete(cardsTable);
  await db.delete(matchesTable);
  res.json({ message: "Tournament reset successfully" });
});

export default router;
