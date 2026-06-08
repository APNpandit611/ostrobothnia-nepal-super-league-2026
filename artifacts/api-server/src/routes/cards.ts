import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cardsTable, teamsTable } from "@workspace/db";
import {
  AddCardParams,
  AddCardBody,
  ListCardsParams,
  DeleteCardParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/matches/:matchId/cards", async (req, res): Promise<void> => {
  const params = ListCardsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));
  const cards = await db.select().from(cardsTable).where(eq(cardsTable.matchId, params.data.matchId)).orderBy(cardsTable.minute);
  const enriched = cards.map(c => ({ ...c, teamName: teamsMap.get(c.teamId)?.name ?? null }));
  res.json(enriched);
});

router.post("/matches/:matchId/cards", async (req, res): Promise<void> => {
  const params = AddCardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [card] = await db.insert(cardsTable).values({
    matchId: params.data.matchId,
    teamId: parsed.data.teamId,
    playerName: parsed.data.playerName ?? null,
    cardType: parsed.data.cardType,
    minute: parsed.data.minute,
  }).returning();

  const teams = await db.select().from(teamsTable);
  const teamsMap = new Map(teams.map(t => [t.id, t]));

  res.status(201).json({ ...card, teamName: teamsMap.get(card.teamId)?.name ?? null });
});

router.delete("/matches/:matchId/cards/:cardId", async (req, res): Promise<void> => {
  const raw = req.params;
  const params = DeleteCardParams.safeParse({
    matchId: parseInt(raw.matchId, 10),
    cardId: parseInt(raw.cardId, 10),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [card] = await db.select().from(cardsTable).where(
    and(eq(cardsTable.id, params.data.cardId), eq(cardsTable.matchId, params.data.matchId))
  );
  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  await db.delete(cardsTable).where(eq(cardsTable.id, params.data.cardId));
  res.sendStatus(204);
});

export default router;
