import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, matchesTable, teamsTable, goalsTable, cardsTable, matchEventsTable } from "@workspace/db";
import {
  CreateMatchBody,
  UpdateMatchBody,
  UpdateMatchParams,
  GetMatchParams,
  StartMatchParams,
  FinishMatchParams,
  ResetMatchParams,
  ListMatchesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function enrichMatch(match: typeof matchesTable.$inferSelect, homeTeam: typeof teamsTable.$inferSelect | undefined, awayTeam: typeof teamsTable.$inferSelect | undefined) {
  return {
    ...match,
    homeTeamName: homeTeam?.name ?? null,
    awayTeamName: awayTeam?.name ?? null,
    homeTeamShortName: homeTeam?.shortName ?? null,
    awayTeamShortName: awayTeam?.shortName ?? null,
  };
}

router.get("/matches", async (req, res): Promise<void> => {
  const queryParsed = ListMatchesQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  const conditions = [];
  if (queryParsed.data.status) {
    conditions.push(eq(matchesTable.status, queryParsed.data.status));
  }

  const matches = await db
    .select()
    .from(matchesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(matchesTable.matchNumber);

  const enriched = matches.map(m => enrichMatch(m, teamsMap.get(m.homeTeamId), teamsMap.get(m.awayTeamId)));
  res.json(enriched);
});

router.post("/matches", async (req, res): Promise<void> => {
  const parsed = CreateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [match] = await db.insert(matchesTable).values(parsed.data).returning();
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  res.status(201).json(enrichMatch(match, teamsMap.get(match.homeTeamId), teamsMap.get(match.awayTeamId)));
});

// Auto-generate round-robin fixtures for all teams
router.post("/matches/generate", async (_req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.id);

  if (teams.length < 2) {
    res.status(400).json({ error: "Need at least 2 teams" });
    return;
  }

  // Delete existing matches and related data
  await db.delete(matchEventsTable);
  await db.delete(goalsTable);
  await db.delete(cardsTable);
  await db.delete(matchesTable);

  // Round-robin: every team plays every other team once
  const fixtures: Array<{ homeTeamId: number; awayTeamId: number }> = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({ homeTeamId: teams[i].id, awayTeamId: teams[j].id });
    }
  }

  // Shuffle for a balanced schedule
  for (let i = fixtures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fixtures[i], fixtures[j]] = [fixtures[j], fixtures[i]];
  }

  // Assign times: 09:00, 09:45, 10:30, 11:15, 12:00, 12:45, 13:30, 14:15, 15:00, 15:45
  const times = [
    "09:00", "09:45", "10:30", "11:15", "12:00",
    "12:45", "13:30", "14:15", "15:00", "15:45",
  ];

  const tournamentDate = "2026-06-27";
  const inserts = fixtures.map((f, idx) => ({
    matchNumber: idx + 1,
    homeTeamId: f.homeTeamId,
    awayTeamId: f.awayTeamId,
    scheduledTime: `${tournamentDate}T${times[idx] || "09:00"}:00`,
    pitch: (idx % 2) + 1,
    homeScore: 0,
    awayScore: 0,
    status: "upcoming",
  }));

  const created = await db.insert(matchesTable).values(inserts).returning();

  const teamsMap = new Map(teams.map(t => [t.id, t]));
  const enriched = created.map((m: typeof matchesTable.$inferSelect) => enrichMatch(m, teamsMap.get(m.homeTeamId), teamsMap.get(m.awayTeamId)));
  res.status(201).json(enriched);
});

router.get("/matches/:id", async (req, res): Promise<void> => {
  const params = GetMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  const goals = await db.select().from(goalsTable).where(eq(goalsTable.matchId, params.data.id)).orderBy(goalsTable.minute);
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.matchId, params.data.id)).orderBy(cardsTable.minute);
  const events = await db.select().from(matchEventsTable).where(eq(matchEventsTable.matchId, params.data.id)).orderBy(matchEventsTable.minute);

  const enrichedGoals = goals.map(g => ({ ...g, teamName: teamsMap.get(g.teamId)?.name ?? null }));
  const enrichedCards = cards.map(c => ({ ...c, teamName: teamsMap.get(c.teamId)?.name ?? null }));
  const enrichedEvents = events.map(e => ({ ...e, teamName: e.teamId ? (teamsMap.get(e.teamId)?.name ?? null) : null }));

  res.json({
    ...enrichMatch(match, teamsMap.get(match.homeTeamId), teamsMap.get(match.awayTeamId)),
    goals: enrichedGoals,
    cards: enrichedCards,
    events: enrichedEvents,
  });
});

router.patch("/matches/:id", async (req, res): Promise<void> => {
  const params = UpdateMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [match] = await db
    .update(matchesTable)
    .set(parsed.data)
    .where(eq(matchesTable.id, params.data.id))
    .returning();
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  res.json(enrichMatch(match, teamsMap.get(match.homeTeamId), teamsMap.get(match.awayTeamId)));
});

router.post("/matches/:id/start", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = StartMatchParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [match] = await db
    .update(matchesTable)
    .set({ status: "live", startedAt: new Date() })
    .where(eq(matchesTable.id, params.data.id))
    .returning();
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  res.json(enrichMatch(match, teamsMap.get(match.homeTeamId), teamsMap.get(match.awayTeamId)));
});

router.post("/matches/:id/finish", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = FinishMatchParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [match] = await db
    .update(matchesTable)
    .set({ status: "finished", finishedAt: new Date() })
    .where(eq(matchesTable.id, params.data.id))
    .returning();
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  res.json(enrichMatch(match, teamsMap.get(match.homeTeamId), teamsMap.get(match.awayTeamId)));
});

router.post("/matches/:id/reset", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ResetMatchParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  // Delete related events, goals, cards
  await db.delete(matchEventsTable).where(eq(matchEventsTable.matchId, params.data.id));
  await db.delete(goalsTable).where(eq(goalsTable.matchId, params.data.id));
  await db.delete(cardsTable).where(eq(cardsTable.matchId, params.data.id));

  const [match] = await db
    .update(matchesTable)
    .set({ status: "upcoming", homeScore: 0, awayScore: 0, startedAt: null, finishedAt: null })
    .where(eq(matchesTable.id, params.data.id))
    .returning();
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  res.json(enrichMatch(match, teamsMap.get(match.homeTeamId), teamsMap.get(match.awayTeamId)));
});

export default router;
