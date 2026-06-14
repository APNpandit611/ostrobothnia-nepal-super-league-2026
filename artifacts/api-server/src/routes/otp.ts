import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, otpVerificationsTable, teamsTable, playersTable } from "@workspace/db";
import { z } from "zod";
import { getAuth, clerkClient } from "@clerk/express";
import { requireAuth } from "../middleware/requireAuth";
import {
  sendSquadSubmissionConfirmation,
  sendAdminSquadApprovalRequest,
  senderFrom,
} from "../lib/mailer";

const router: IRouter = Router();

const MAX_PLAYERS = 15;
const IS_PROD = process.env["NODE_ENV"] === "production";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendViaResend(to: string, code: string, log: (obj: object, msg: string) => void): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    log({ reason: "RESEND_API_KEY not set" }, "Resend skipped");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: senderFrom("ONSL 2026"),
        to,
        subject: "ONSL 2026 — Your verification code",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#16a34a">Ostrobothnia Nepal Super League 2026</h2>
            <p>Your team registration verification code is:</p>
            <div style="font-size:40px;font-weight:900;letter-spacing:8px;text-align:center;padding:24px 0;color:#111">${code}</div>
            <p style="color:#666;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "(unreadable)");
      log({ status: res.status, body }, "Resend API error");
      return false;
    }
    return true;
  } catch (err) {
    log({ err }, "Resend fetch failed");
    return false;
  }
}

const SendOtpBody = z.object({
  contact: z.string().email().max(320),
  type: z.enum(["email"]),
  teamId: z.number().int().positive().optional(),
});

const VerifyOtpBody = z.object({
  id: z.string().min(1),
  code: z.string().length(6),
});

router.post("/register/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { contact, type, teamId } = parsed.data;

  // If teamId is provided, verify the team exists
  if (teamId !== undefined) {
    const [team] = await db.select({ id: teamsTable.id }).from(teamsTable).where(eq(teamsTable.id, teamId));
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const [record] = await db
    .insert(otpVerificationsTable)
    .values({ contact, type, code, expiresAt, teamId: teamId ?? null })
    .returning();

  let emailDelivered = false;

  if (type === "email") {
    emailDelivered = await sendViaResend(contact, code, (obj, msg) => req.log.info(obj, msg));
    if (emailDelivered) {
      req.log.info({ contact }, "OTP email sent via Resend");
    } else {
      req.log.info({ contact, ...(IS_PROD ? {} : { code }) }, "OTP CODE (email delivery failed)");
    }
  } else {
    req.log.info({ contact, ...(IS_PROD ? {} : { code }) }, "OTP CODE (SMS — no SMS provider configured)");
  }

  res.status(200).json({ id: record.id });
});

router.post("/register/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { id, code } = parsed.data;
  const now = new Date();

  const [record] = await db
    .select()
    .from(otpVerificationsTable)
    .where(
      and(
        eq(otpVerificationsTable.id, id),
        eq(otpVerificationsTable.code, code),
        eq(otpVerificationsTable.verified, false),
        gt(otpVerificationsTable.expiresAt, now),
      )
    );

  if (!record) {
    res.status(400).json({ error: "Invalid or expired code" });
    return;
  }

  await db
    .update(otpVerificationsTable)
    .set({ verified: true })
    .where(eq(otpVerificationsTable.id, id));

  res.json({ verified: true });
});

// Public: register a new team + players in one atomic call (requires a verified OTP)
const RegisterPlayerInput = z.object({
  name: z.string().min(1).max(100),
  number: z.union([z.number().int().min(1).max(99), z.null()]).optional(),
  position: z.string().max(30).optional().nullable(),
  email: z.string().max(320).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
});

const RegisterTeamBody = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().min(1).max(10),
  primaryColor: z.string().max(20).optional().nullable(),
  logoUrl: z.string().max(2_000_000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  managerName: z.string().max(100).optional().nullable(),
  managerPhone: z.string().max(30).optional().nullable(),
  managerEmail: z.string().max(320).optional().nullable(),
  players: z.array(RegisterPlayerInput).min(1).max(MAX_PLAYERS),
});

router.post("/register/team", async (req, res): Promise<void> => {
  const parsed = RegisterTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required to register a team" });
    return;
  }

  const { players, ...teamData } = parsed.data;

  let clerkEmail: string | null = null;
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    clerkEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? null;
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch Clerk user for team registration");
  }

  // Create team — manager email comes from the verified Clerk identity
  const [team] = await db
    .insert(teamsTable)
    .values({
      name: teamData.name.trim(),
      shortName: teamData.shortName.trim(),
      primaryColor: teamData.primaryColor ?? "#16a34a",
      logoUrl: teamData.logoUrl ?? null,
      city: teamData.city ?? null,
      category: teamData.category ?? null,
      managerName: teamData.managerName ?? null,
      managerPhone: teamData.managerPhone ?? null,
      managerEmail: clerkEmail ?? teamData.managerEmail ?? null,
      // Squad is submitted at registration → enters the admin approval queue.
      // Stays hidden from all public pages until an admin approves it.
      squadStatus: "pending",
    })
    .returning();

  // Add players
  await db.insert(playersTable).values(
    players.map(p => ({
      teamId: team.id,
      name: p.name.trim(),
      number: p.number ?? null,
      position: p.position ?? null,
      email: p.email ?? null,
      phone: p.phone ?? null,
    }))
  );

  // Notify the manager (confirmation) and the admin (approval request).
  // Fire-and-forget: email delivery must never block or fail the registration.
  void Promise.allSettled([
    sendSquadSubmissionConfirmation(team),
    sendAdminSquadApprovalRequest(team),
  ]).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") req.log.error({ err: r.reason }, "Squad registration email rejected");
    });
  });

  res.status(201).json(team);
});

const UpdateSquadBody = z.object({
  teamId: z.number().int().positive(),
  captainIndex: z.number().int().min(0).optional().nullable(),
  players: z.array(z.object({
    name: z.string().min(1).max(100),
    number: z.union([z.number().int().min(1).max(99), z.null()]).optional(),
    position: z.string().max(30).optional().nullable(),
  })).min(1).max(MAX_PLAYERS),
});

router.post("/register/update-squad", async (req, res): Promise<void> => {
  const parsed = UpdateSquadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in required to update squad" });
    return;
  }

  const { teamId, players, captainIndex } = parsed.data;

  let clerkEmail: string | null = null;
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    clerkEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? null;
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch Clerk user for squad update");
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  // If team has a registered manager email, only that manager can update
  if (team.managerEmail && clerkEmail && team.managerEmail !== clerkEmail) {
    res.status(403).json({ error: "This account is not registered as the manager for this team." });
    return;
  }

  // Lock squad once admin has approved — only admin can edit after that
  if (team.squadStatus === "approved") {
    res.status(403).json({ error: "Squad is locked after admin approval. Contact the admin to make changes." });
    return;
  }

  // First-time claim: if team has no manager email, assign the current user
  if (!team.managerEmail && clerkEmail) {
    await db.update(teamsTable).set({ managerEmail: clerkEmail }).where(eq(teamsTable.id, teamId));
  }

  await db.delete(playersTable).where(eq(playersTable.teamId, teamId));

  await db.insert(playersTable).values(
    players.map((p, i) => ({
      teamId,
      name: p.name.trim(),
      number: p.number ?? null,
      position: p.position ?? null,
      isCaptain: captainIndex != null ? i === captainIndex : false,
    }))
  );

  // Mark squad as pending approval
  await db.update(teamsTable).set({ squadStatus: "pending" }).where(eq(teamsTable.id, teamId));

  // Notify the manager (confirmation) and the admin (approval request). The manager
  // email is whatever is on the team, or the Clerk identity claiming it for the first time.
  const effectiveTeam = { ...team, managerEmail: team.managerEmail ?? clerkEmail };
  void Promise.allSettled([
    sendSquadSubmissionConfirmation(effectiveTeam),
    sendAdminSquadApprovalRequest(effectiveTeam),
  ]).then((results) => {
    results.forEach((r) => {
      if (r.status === "rejected") req.log.error({ err: r.reason }, "Squad update email rejected");
    });
  });

  const newPlayers = await db.select().from(playersTable).where(eq(playersTable.teamId, teamId));
  res.json(newPlayers);
});

// Admin: list OTP records (for debugging purposes — requires auth)
router.get("/admin/otp-records", requireAuth, async (req, res): Promise<void> => {
  const records = await db
    .select({ id: otpVerificationsTable.id, contact: otpVerificationsTable.contact, verified: otpVerificationsTable.verified, createdAt: otpVerificationsTable.createdAt })
    .from(otpVerificationsTable)
    .orderBy(otpVerificationsTable.createdAt);
  res.json(records);
});

export default router;
