import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, matchesTable, teamsTable, goalsTable, cardsTable, matchEventsTable, playersTable } from "@workspace/db";
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

  // Only show matches where both teams have at least one registered player
  const playerRows = await db.selectDistinct({ teamId: playersTable.teamId }).from(playersTable);
  const registeredIds = new Set(playerRows.map(r => r.teamId));

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

  const enriched = matches
    .filter(m => registeredIds.has(m.homeTeamId) && registeredIds.has(m.awayTeamId))
    .map(m => enrichMatch(m, teamsMap.get(m.homeTeamId), teamsMap.get(m.awayTeamId)));
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
router.post("/matches/generate", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD is not configured");
    res.status(503).json({ error: "Admin password is not configured" });
    return;
  }
  if (!password || password !== adminPassword) {
    res.status(403).json({ error: "Incorrect password" });
    return;
  }

  const teams = await db.select().from(teamsTable).orderBy(teamsTable.id);

  if (teams.length < 2) {
    res.status(400).json({ error: `Not enough teams — ${teams.length} registered, need at least 2` });
    return;
  }

  // Delete existing matches and related data
  await db.delete(matchEventsTable);
  await db.delete(goalsTable);
  await db.delete(cardsTable);
  await db.delete(matchesTable);

  // Look up teams by short name for a deterministic schedule
  const byShortName = new Map(teams.map(t => [t.shortName, t.id]));
  const KSB = byShortName.get("KSB")!;
  const JNK = byShortName.get("JNK")!;
  const ONS = byShortName.get("ONS")!;
  const SIS = byShortName.get("SIS")!;
  const VNR = byShortName.get("VNR")!;

  // Official ONSL 2026 schedule — Santahaka, Kokkola, 28 June 2026
  // Time  | Field A (Pitch 1)  | Field B (Pitch 2)
  // 10:15 | KSB vs JNK         | ONS vs SIS
  // 10:52 | KSB vs ONS         | VNR vs JNK
  // 11:29 | KSB vs VNR         | JNK vs SIS
  // 12:06 | KSB vs SIS         | ONS vs VNR
  // Lunch break 12:33–13:15
  // 13:15 | JNK vs ONS         | SIS vs VNR
  const tournamentDate = "2026-06-28";
  const schedule = [
    { matchNumber: 1,  homeTeamId: KSB, awayTeamId: JNK, time: "10:15", pitch: 1 },
    { matchNumber: 2,  homeTeamId: ONS, awayTeamId: SIS, time: "10:15", pitch: 2 },
    { matchNumber: 3,  homeTeamId: KSB, awayTeamId: ONS, time: "10:52", pitch: 1 },
    { matchNumber: 4,  homeTeamId: VNR, awayTeamId: JNK, time: "10:52", pitch: 2 },
    { matchNumber: 5,  homeTeamId: KSB, awayTeamId: VNR, time: "11:29", pitch: 1 },
    { matchNumber: 6,  homeTeamId: JNK, awayTeamId: SIS, time: "11:29", pitch: 2 },
    { matchNumber: 7,  homeTeamId: KSB, awayTeamId: SIS, time: "12:06", pitch: 1 },
    { matchNumber: 8,  homeTeamId: ONS, awayTeamId: VNR, time: "12:06", pitch: 2 },
    { matchNumber: 9,  homeTeamId: JNK, awayTeamId: ONS, time: "13:15", pitch: 1 },
    { matchNumber: 10, homeTeamId: SIS, awayTeamId: VNR, time: "13:15", pitch: 2 },
  ];

  const inserts = schedule.map(s => ({
    matchNumber: s.matchNumber,
    homeTeamId: s.homeTeamId,
    awayTeamId: s.awayTeamId,
    scheduledTime: `${tournamentDate}T${s.time}:00`,
    pitch: s.pitch,
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
