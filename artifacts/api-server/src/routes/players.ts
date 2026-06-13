import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const TeamIdParam = z.object({ teamId: z.coerce.number().int().positive() });
const PlayerIdParam = z.object({ teamId: z.coerce.number().int().positive(), playerId: z.coerce.number().int().positive() });
const PlayerInput = z.object({
  name: z.string().min(1),
  number: z.number().int().min(1).max(99).optional().nullable(),
  position: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
});
const PlayerUpdate = z.object({
  name: z.string().min(1).optional(),
  number: z.number().int().min(1).max(99).optional().nullable(),
  position: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
});

router.get("/teams/:teamId/players", async (req, res): Promise<void> => {
  const params = TeamIdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const players = await db.select().from(playersTable)
    .where(eq(playersTable.teamId, params.data.teamId))
    .orderBy(playersTable.number, playersTable.name);
  res.json(players);
});

router.post("/teams/:teamId/players", async (req, res): Promise<void> => {
  const params = TeamIdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = PlayerInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [player] = await db.insert(playersTable).values({
    teamId: params.data.teamId,
    name: parsed.data.name,
    number: parsed.data.number ?? null,
    position: parsed.data.position ?? null,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
  }).returning();
  res.status(201).json(player);
});

router.patch("/teams/:teamId/players/:playerId", async (req, res): Promise<void> => {
  const params = PlayerIdParam.safeParse({
    teamId: parseInt(req.params.teamId, 10),
    playerId: parseInt(req.params.playerId, 10),
  });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = PlayerUpdate.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(playersTable)
    .set(parsed.data)
    .where(and(eq(playersTable.id, params.data.playerId), eq(playersTable.teamId, params.data.teamId)))
    .returning();
  if (!updated) { res.status(404).json({ error: "Player not found" }); return; }
  res.json(updated);
});

router.delete("/teams/:teamId/players/:playerId", async (req, res): Promise<void> => {
  const params = PlayerIdParam.safeParse({
    teamId: parseInt(req.params.teamId, 10),
    playerId: parseInt(req.params.playerId, 10),
  });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const deleted = await db.delete(playersTable).where(
    and(eq(playersTable.id, params.data.playerId), eq(playersTable.teamId, params.data.teamId))
  ).returning();
  if (!deleted.length) { res.status(404).json({ error: "Player not found" }); return; }
  res.sendStatus(204);
});

export default router;
