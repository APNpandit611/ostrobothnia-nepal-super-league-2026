import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, goalsTable, matchesTable, teamsTable } from "@workspace/db";
import {
  AddGoalParams,
  AddGoalBody,
  ListGoalsParams,
  DeleteGoalParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/matches/:matchId/goals", async (req, res): Promise<void> => {
  const params = ListGoalsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.matchId, params.data.matchId)).orderBy(goalsTable.minute);
  const enriched = goals.map(g => ({ ...g, teamName: teamsMap.get(g.teamId)?.name ?? null }));
  res.json(enriched);
});

router.post("/matches/:matchId/goals", async (req, res): Promise<void> => {
  const params = AddGoalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Get match to determine which team scored
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [goal] = await db.insert(goalsTable).values({
    matchId: params.data.matchId,
    teamId: parsed.data.teamId,
    scorerName: parsed.data.scorerName ?? null,
    assistName: parsed.data.assistName ?? null,
    minute: parsed.data.minute,
    isOwnGoal: parsed.data.isOwnGoal ?? false,
  }).returning();

  // Update match score
  // If own goal, it goes to the opposing team
  const isOwnGoal = parsed.data.isOwnGoal ?? false;
  const scoringTeam = isOwnGoal
    ? (parsed.data.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId)
    : parsed.data.teamId;

  if (scoringTeam === match.homeTeamId) {
    await db.update(matchesTable).set({ homeScore: match.homeScore + 1 }).where(eq(matchesTable.id, params.data.matchId));
  } else {
    await db.update(matchesTable).set({ awayScore: match.awayScore + 1 }).where(eq(matchesTable.id, params.data.matchId));
  }

  // Add a match event
  await db.insert(goalsTable);
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  res.status(201).json({ ...goal, teamName: teamsMap.get(goal.teamId)?.name ?? null });
});

router.delete("/matches/:matchId/goals/:goalId", async (req, res): Promise<void> => {
  const raw = req.params;
  const params = DeleteGoalParams.safeParse({
    matchId: parseInt(raw.matchId, 10),
    goalId: parseInt(raw.goalId, 10),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [goal] = await db.select().from(goalsTable).where(
    and(eq(goalsTable.id, params.data.goalId), eq(goalsTable.matchId, params.data.matchId))
  );
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  await db.delete(goalsTable).where(eq(goalsTable.id, params.data.goalId));

  // Recalculate score by counting goals
  const allGoals = await db.select().from(goalsTable).where(eq(goalsTable.matchId, params.data.matchId));
  let homeScore = 0;
  let awayScore = 0;
  for (const g of allGoals) {
    const isOwnGoal = g.isOwnGoal;
    const scoringTeam = isOwnGoal
      ? (g.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId)
      : g.teamId;
    if (scoringTeam === match.homeTeamId) homeScore++;
    else awayScore++;
  }
  await db.update(matchesTable).set({ homeScore, awayScore }).where(eq(matchesTable.id, params.data.matchId));

  res.sendStatus(204);
});

export default router;
