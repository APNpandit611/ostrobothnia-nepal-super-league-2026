import { Router, type IRouter } from "express";
import { db, tournamentImagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tournament-images", async (req, res): Promise<void> => {
  const tournamentId = req.query.tournamentId;
  let rows;
  if (tournamentId) {
    rows = await db.select().from(tournamentImagesTable).where(eq(tournamentImagesTable.tournamentId, Number(tournamentId)));
  } else {
    rows = await db.select().from(tournamentImagesTable);
  }
  res.json(rows);
});

router.get("/tournament-images/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [row] = await db.select().from(tournamentImagesTable).where(eq(tournamentImagesTable.id, id));
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.json(row);
});

router.post("/tournament-images", async (req, res): Promise<void> => {
  const body = req.body;
  const [row] = await db.insert(tournamentImagesTable).values({
    tournamentId: body.tournamentId,
    imageUrl: body.imageUrl,
    caption: body.caption ?? null,
  }).returning();
  res.status(201).json(row);
});

router.patch("/tournament-images/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const updateData: Record<string, unknown> = {};
  if (body.tournamentId !== undefined) updateData.tournamentId = body.tournamentId;
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
  if (body.caption !== undefined) updateData.caption = body.caption;
  const [row] = await db.update(tournamentImagesTable).set(updateData).where(eq(tournamentImagesTable.id, id)).returning();
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.json(row);
});

router.delete("/tournament-images/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.delete(tournamentImagesTable).where(eq(tournamentImagesTable.id, id));
  res.status(204).end();
});

export default router;
