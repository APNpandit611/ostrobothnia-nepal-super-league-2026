import { Router, type IRouter } from "express";
import { db, tournamentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tournaments", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tournamentsTable).orderBy(tournamentsTable.createdAt);
  res.json(rows);
});

router.get("/tournaments/active", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tournamentsTable).orderBy(tournamentsTable.createdAt);
  const active = rows.find((t) => t.isActive) ?? rows[rows.length - 1] ?? null;
  if (!active) {
    res.status(404).json({ message: "No tournament found" });
    return;
  }
  res.json(active);
});

router.post("/tournaments", async (req, res): Promise<void> => {
  const body = req.body;
  const [row] = await db.insert(tournamentsTable).values({
    name: body.name,
    shortName: body.shortName ?? null,
    date: body.date,
    venue: body.venue,
    city: body.city ?? null,
    format: body.format ?? "7-a-side",
    maxTeams: body.maxTeams ?? 5,
    kickoffTime: body.kickoffTime ?? "10:00",
    description: body.description ?? null,
    rules: body.rules ?? null,
    prizes: body.prizes ?? null,
    status: body.status ?? "upcoming",
    isActive: body.isActive ?? false,
  }).returning();
  res.status(201).json(row);
});

router.patch("/tournaments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.shortName !== undefined) updateData.shortName = body.shortName;
  if (body.date !== undefined) updateData.date = body.date;
  if (body.venue !== undefined) updateData.venue = body.venue;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.format !== undefined) updateData.format = body.format;
  if (body.maxTeams !== undefined) updateData.maxTeams = body.maxTeams;
  if (body.kickoffTime !== undefined) updateData.kickoffTime = body.kickoffTime;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.rules !== undefined) updateData.rules = body.rules;
  if (body.prizes !== undefined) updateData.prizes = body.prizes;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  const [row] = await db.update(tournamentsTable).set(updateData).where(eq(tournamentsTable.id, id)).returning();
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.json(row);
});

router.delete("/tournaments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.delete(tournamentsTable).where(eq(tournamentsTable.id, id));
  res.status(204).end();
});

export default router;
