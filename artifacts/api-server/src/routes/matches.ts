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

  // Generate a single round-robin from whatever teams are registered, using the
  // circle method so it works for any team count (>= 2) and any names.
  const TOURNAMENT_DATE = "2026-06-28";
  const FIRST_KICKOFF = "10:15";
  const SLOT_INTERVAL_MIN = 37; // gap between consecutive time slots

  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(":").map(Number);
    const total = h * 60 + m + minutes;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  // Pad with a sentinel "bye" when the team count is odd.
  const BYE = -1;
  const ids: number[] = teams.map(t => t.id);
  if (ids.length % 2 === 1) ids.push(BYE);
  const slots = ids.length;
  const roundsCount = slots - 1;
  const half = slots / 2;

  let rotation = [...ids];
  const inserts: Array<{
    matchNumber: number;
    homeTeamId: number;
    awayTeamId: number;
    scheduledTime: string;
    pitch: number;
    homeScore: number;
    awayScore: number;
    status: string;
  }> = [];
  let matchNumber = 1;

  for (let round = 0; round < roundsCount; round++) {
    const time = addMinutes(FIRST_KICKOFF, round * SLOT_INTERVAL_MIN);
    let pitch = 1;
    for (let i = 0; i < half; i++) {
      const a = rotation[i];
      const b = rotation[slots - 1 - i];
      if (a === BYE || b === BYE) continue;
      // Alternate home/away by round so no team is always "home".
      const [homeTeamId, awayTeamId] = round % 2 === 0 ? [a, b] : [b, a];
      inserts.push({
        matchNumber: matchNumber++,
        homeTeamId,
        awayTeamId,
        scheduledTime: `${TOURNAMENT_DATE}T${time}:00`,
        pitch: pitch++,
        homeScore: 0,
        awayScore: 0,
        status: "upcoming",
      });
    }
    // Rotate, keeping the first slot fixed (standard circle method).
    rotation = [rotation[0], rotation[slots - 1], ...rotation.slice(1, slots - 1)];
  }

  // Replace fixtures atomically: clear old matches and related data, then insert
  // the new schedule. If the insert fails, the deletes roll back too.
  const created = await db.transaction(async (tx) => {
    await tx.delete(matchEventsTable);
    await tx.delete(goalsTable);
    await tx.delete(cardsTable);
    await tx.delete(matchesTable);
    return tx.insert(matchesTable).values(inserts).returning();
  });

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
