import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clubSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreate() {
  const rows = await db.select().from(clubSettingsTable).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(clubSettingsTable).values({ storyParagraphs: [] }).returning();
  return created;
}

router.get("/api/club-settings", async (req, res): Promise<void> => {
  try {
    const settings = await getOrCreate();
    res.json(settings);
  } catch (err) {
    req.log.error(err, "Failed to get club settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/admin/club-settings", async (req, res): Promise<void> => {
  const { storyParagraphs } = req.body as { storyParagraphs?: string[] };
  try {
    const existing = await getOrCreate();
    const [updated] = await db
      .update(clubSettingsTable)
      .set({
        ...(Array.isArray(storyParagraphs) && { storyParagraphs }),
        updatedAt: new Date(),
      })
      .where(eq(clubSettingsTable.id, existing.id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error(err, "Failed to update club settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
