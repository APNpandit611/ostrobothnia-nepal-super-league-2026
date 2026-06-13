import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, otpVerificationsTable } from "@workspace/db";
import { z } from "zod";
import nodemailer from "nodemailer";

const router: IRouter = Router();

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

const SendOtpBody = z.object({
  contact: z.string().min(1),
  type: z.enum(["email", "phone"]),
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

  const { contact, type } = parsed.data;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const [record] = await db
    .insert(otpVerificationsTable)
    .values({ contact, type, code, expiresAt })
    .returning();

  let emailDelivered = false;

  if (type === "email") {
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
        req.log.info({ contact, type }, "OTP email sent");
        emailDelivered = true;
      } catch (err) {
        req.log.error({ err }, "Failed to send OTP email — falling back to log");
        req.log.info({ contact, code }, "OTP CODE (email send failed — showing in response)");
      }
    } else {
      req.log.info({ contact, code }, "OTP CODE (no SMTP configured — dev mode)");
    }
  } else {
    req.log.info({ contact, code }, "OTP CODE (SMS — dev mode, no SMS provider configured)");
  }

  res.status(200).json({
    id: record.id,
    // Only expose the code in the response when delivery failed (no SMTP or send error)
    ...(emailDelivered ? {} : { devCode: code }),
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

export default router;
