import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, matchEventsTable, teamsTable } from "@workspace/db";
import {
  AddMatchEventParams,
  AddMatchEventBody,
  ListMatchEventsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/matches/:matchId/events", async (req, res): Promise<void> => {
  const params = ListMatchEventsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  const events = await db.select().from(matchEventsTable).where(eq(matchEventsTable.matchId, params.data.matchId)).orderBy(matchEventsTable.minute);
  const enriched = events.map(e => ({ ...e, teamName: e.teamId ? (teamsMap.get(e.teamId)?.name ?? null) : null }));
  res.json(enriched);
});

router.post("/matches/:matchId/events", async (req, res): Promise<void> => {
  const params = AddMatchEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddMatchEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [event] = await db.insert(matchEventsTable).values({
    matchId: params.data.matchId,
    teamId: parsed.data.teamId ?? null,
    eventType: parsed.data.eventType,
    minute: parsed.data.minute,
    description: parsed.data.description ?? null,
    playerName: parsed.data.playerName ?? null,
  }).returning();

  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  res.status(201).json({ ...event, teamName: event.teamId ? (teamsMap.get(event.teamId)?.name ?? null) : null });
});

export default router;
