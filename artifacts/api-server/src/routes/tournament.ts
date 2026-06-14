import { Router, type IRouter } from "express";
import { db, matchesTable, goalsTable, cardsTable, matchEventsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/tournament/reset", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };
  const resetPassword = process.env.RESET_PASSWORD;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!resetPassword && !adminPassword) {
    req.log.error("Neither RESET_PASSWORD nor ADMIN_PASSWORD is configured");
    res.status(503).json({ message: "Reset password is not configured" });
    return;
  }
  if (!password || (password !== resetPassword && password !== adminPassword)) {
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
