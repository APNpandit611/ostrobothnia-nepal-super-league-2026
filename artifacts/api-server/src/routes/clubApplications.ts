import { Router, type IRouter } from "express";
import { db, clubApplicationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";
import {
  sendApplicationConfirmation,
  sendAdminApprovalRequest,
  sendApplicationApproved,
} from "../lib/mailer";

const router: IRouter = Router();

// Public: submit a club membership application
router.post("/club-applications", async (req, res): Promise<void> => {
  const { name, email, phone, dob, position, message } = req.body as Record<string, string>;
  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ message: "Name and email are required" });
    return;
  }
  const [row] = await db.insert(clubApplicationsTable).values({
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    dob: dob?.trim() || null,
    position: position?.trim() || null,
    message: message?.trim() || null,
  }).returning();

  // Notify the applicant (from the KSB email) and send an approval request to the admin.
  // Fire-and-forget: email delivery should never block or fail the submission.
  void Promise.allSettled([
    sendApplicationConfirmation(row),
    sendAdminApprovalRequest(row),
  ]).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") req.log.error({ err: r.reason }, "Application email rejected");
    });
  });

  res.status(201).json(row);
});

// Admin: list all applications
router.get("/admin/club-applications", async (req, res): Promise<void> => {
  const { status } = req.query as Record<string, string>;
  const rows = await db
    .select()
    .from(clubApplicationsTable)
    .where(status ? eq(clubApplicationsTable.status, status) : undefined)
    .orderBy(desc(clubApplicationsTable.createdAt));
  res.json(rows);
});

// Admin: update application status (accept / reject)
router.patch("/admin/club-applications/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { status, adminNote } = req.body as { status?: string; adminNote?: string };

  const [existing] = await db
    .select()
    .from(clubApplicationsTable)
    .where(eq(clubApplicationsTable.id, id));
  if (!existing) { res.status(404).json({ message: "Not found" }); return; }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (status) update.status = status;
  if (adminNote !== undefined) update.adminNote = adminNote;
  const [row] = await db
    .update(clubApplicationsTable)
    .set(update)
    .where(eq(clubApplicationsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ message: "Not found" }); return; }

  // On transition to "accepted", send the applicant a no-reply welcome email.
  if (status === "accepted" && existing.status !== "accepted") {
    void sendApplicationApproved(row).catch((err) =>
      req.log.error({ err }, "Approval email rejected"),
    );
  }

  res.json(row);
});

// Admin: delete application
router.delete("/admin/club-applications/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [row] = await db.delete(clubApplicationsTable).where(eq(clubApplicationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ message: "Not found" }); return; }
  res.status(204).send();
});

export default router;
