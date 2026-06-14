import { Router, type IRouter } from "express";
import { db, announcementsTable } from "@workspace/db";
import { eq, and, ilike, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/announcements", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(announcementsTable)
    .where(eq(announcementsTable.isPublished, true))
    .orderBy(desc(announcementsTable.createdAt));
  res.json(rows);
});

router.get("/admin/announcements", async (req, res): Promise<void> => {
  const { status, category, search } = req.query as Record<string, string>;
  const conditions = [];
  if (status === "draft") conditions.push(eq(announcementsTable.status, "draft"));
  if (status === "published") conditions.push(eq(announcementsTable.status, "published"));
  if (category) conditions.push(eq(announcementsTable.category, category));
  if (search) conditions.push(ilike(announcementsTable.title, `%${search}%`));
  const rows = await db
    .select()
    .from(announcementsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(announcementsTable.createdAt));
  res.json(rows);
});

router.post("/admin/announcements", async (req, res): Promise<void> => {
  const body = req.body;
  const now = new Date();
  const isPublished = body.isPublished === true;
  const [row] = await db.insert(announcementsTable).values({
    title: body.title,
    content: body.content,
    category: body.category ?? "General",
    author: body.author ?? "Admin",
    status: isPublished ? "published" : "draft",
    isPublished,
    publishDate: isPublished ? now : (body.publishDate ? new Date(body.publishDate) : null),
    updatedAt: now,
  }).returning();
  res.status(201).json(row);
});

router.patch("/admin/announcements/:id/publish", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { isPublished } = req.body as { isPublished: boolean };
  const [row] = await db
    .update(announcementsTable)
    .set({
      isPublished,
      status: isPublished ? "published" : "draft",
      publishDate: isPublished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(announcementsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.json(row);
});

router.patch("/admin/announcements/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) update.title = body.title;
  if (body.content !== undefined) update.content = body.content;
  if (body.category !== undefined) update.category = body.category;
  if (body.author !== undefined) update.author = body.author;
  if (body.isPublished !== undefined) {
    update.isPublished = body.isPublished;
    update.status = body.isPublished ? "published" : "draft";
    if (body.isPublished) update.publishDate = new Date();
  }
  if (body.publishDate !== undefined) update.publishDate = body.publishDate ? new Date(body.publishDate) : null;
  const [row] = await db
    .update(announcementsTable)
    .set(update)
    .where(eq(announcementsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.json(row);
});

router.delete("/admin/announcements/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [row] = await db.delete(announcementsTable).where(eq(announcementsTable.id, id)).returning();
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.status(204).send();
});

export default router;
