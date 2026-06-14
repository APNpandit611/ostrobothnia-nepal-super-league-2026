import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, otpVerificationsTable, teamsTable, playersTable } from "@workspace/db";
import { z } from "zod";
import nodemailer from "nodemailer";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();

const MAX_PLAYERS = 15;
const IS_PROD = process.env["NODE_ENV"] === "production";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getTransporter() {
  const host = process.env["SMTP_HOST"];
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env["SMTP_PORT"] || "587"),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  });
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
        from: "ONSL 2026 <onboarding@resend.dev>",
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
  contact: z.string().min(1).max(320),
  type: z.enum(["email", "phone"]),
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
    // Try Resend first (works from cloud servers)
    emailDelivered = await sendViaResend(contact, code, (obj, msg) => req.log.info(obj, msg));
    if (emailDelivered) {
      req.log.info({ contact }, "OTP email sent via Resend");
    } else {
      // Fall back to SMTP
      const transporter = getTransporter();
      if (transporter) {
        try {
          const from = process.env["SMTP_FROM"] || process.env["SMTP_USER"] || "noreply@onsl2026.fi";
          await transporter.sendMail({
            from,
            to: contact,
            subject: "ONSL 2026 — Your verification code",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2 style="color:#16a34a">Ostrobothnia Nepal Super League 2026</h2>
                <p>Your team registration verification code is:</p>
                <div style="font-size:40px;font-weight:900;letter-spacing:8px;text-align:center;padding:24px 0;color:#111">${code}</div>
                <p style="color:#666;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
              </div>
            `,
          });
          req.log.info({ contact, type }, "OTP email sent via SMTP");
          emailDelivered = true;
        } catch (err) {
          req.log.error({ err }, "Failed to send OTP email via SMTP");
        }
      }
      if (!emailDelivered) {
        req.log.info({ contact, code }, "OTP CODE (all delivery methods failed)");
      }
    }
  } else {
    req.log.info({ contact, code }, "OTP CODE (SMS — no SMS provider configured)");
  }

  res.status(200).json({
    id: record.id,
    // Only expose code in non-production when delivery failed (dev convenience)
    ...(!emailDelivered && !IS_PROD ? { devCode: code } : {}),
  });
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
  otpId: z.string().min(1),
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

  const { otpId, players, ...teamData } = parsed.data;

  // Verify OTP
  const [otp] = await db
    .select()
    .from(otpVerificationsTable)
    .where(and(
      eq(otpVerificationsTable.id, otpId),
      eq(otpVerificationsTable.verified, true),
    ));

  if (!otp) {
    res.status(403).json({ error: "OTP not verified — please verify your identity first" });
    return;
  }

  // Create team
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
      managerEmail: teamData.managerEmail ?? null,
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

  res.status(201).json(team);
});

const UpdateSquadBody = z.object({
  teamId: z.number().int().positive(),
  otpId: z.string().min(1),
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

  const { teamId, otpId, players } = parsed.data;

  // Verify OTP and that it was issued for this specific team
  const [otp] = await db
    .select()
    .from(otpVerificationsTable)
    .where(and(
      eq(otpVerificationsTable.id, otpId),
      eq(otpVerificationsTable.verified, true),
    ));

  if (!otp) {
    res.status(403).json({ error: "OTP not verified — please verify your identity first" });
    return;
  }

  // Ensure the OTP was issued for this exact team
  if (otp.teamId !== null && otp.teamId !== teamId) {
    res.status(403).json({ error: "OTP was not issued for this team" });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  await db.delete(playersTable).where(eq(playersTable.teamId, teamId));

  await db.insert(playersTable).values(
    players.map(p => ({
      teamId,
      name: p.name.trim(),
      number: p.number ?? null,
      position: p.position ?? null,
    }))
  );

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
