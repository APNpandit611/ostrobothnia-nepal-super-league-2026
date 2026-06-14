import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

const KSB_NAME = "Kokkola Soccer Boys";
const DEFAULT_FROM = "ksoccerboys@gmail.com";

let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;
  const host = process.env["SMTP_HOST"];
  if (!host) {
    logger.warn("SMTP_HOST not set — club application emails disabled");
    cachedTransporter = null;
    return null;
  }
  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env["SMTP_PORT"] || "587"),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  });
  return cachedTransporter;
}

function bareAddress(): string {
  const addr = process.env["SMTP_FROM"] || process.env["SMTP_USER"] || DEFAULT_FROM;
  const match = addr.match(/<(.+)>/);
  return match ? match[1] : addr;
}

function ksbFrom(): string {
  return `${KSB_NAME} <${bareAddress()}>`;
}

function noReplyFrom(): string {
  return `${KSB_NAME} (No Reply) <${bareAddress()}>`;
}

function adminEmail(): string | null {
  return process.env["ADMIN_EMAIL"] || process.env["SMTP_USER"] || bareAddress() || null;
}

function adminPanelUrl(): string {
  const domain = (process.env["REPLIT_DOMAINS"] || "").split(",")[0]?.trim();
  if (!domain) return "/admin/club-applications";
  return `https://${domain}/admin/club-applications`;
}

function shell(inner: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="color:#16a34a;margin:0 0 4px">Kokkola Soccer Boys</h2>
      <p style="color:#888;font-size:13px;margin:0 0 20px">Ostrobothnia Nepal Super League 2026</p>
      ${inner}
    </div>
  `;
}

function row(label: string, value?: string | null): string {
  if (!value) return "";
  return `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:14px;vertical-align:top">${label}</td><td style="padding:4px 0;font-size:14px;font-weight:600">${value}</td></tr>`;
}

export interface ClubApplication {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  dob?: string | null;
  position?: string | null;
  message?: string | null;
}

async function send(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  context: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    logger.info({ to: opts.to, context: opts.context }, "Email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to, context: opts.context }, "Failed to send email");
    return false;
  }
}

// 1. Sent to the applicant right after they submit — from the KSB email.
export async function sendApplicationConfirmation(app: ClubApplication): Promise<boolean> {
  const html = shell(`
    <p style="font-size:15px">Hi ${app.name},</p>
    <p style="font-size:15px;line-height:1.6">
      Thanks for applying to join <strong>Kokkola Soccer Boys</strong>! We've received your
      application and our team will review it shortly. We'll be in touch at this email address
      with the next steps.
    </p>
    <p style="font-size:14px;color:#666;line-height:1.6">
      If you have any questions in the meantime, just reply to this email.
    </p>
    <p style="font-size:15px;margin-top:24px">— The KSB Team</p>
  `);
  return send({
    from: ksbFrom(),
    to: app.email,
    replyTo: bareAddress(),
    subject: "We received your application — Kokkola Soccer Boys",
    html,
    context: "application_confirmation",
  });
}

// 2. Approval request sent to the admin when a new application arrives.
export async function sendAdminApprovalRequest(app: ClubApplication): Promise<boolean> {
  const to = adminEmail();
  if (!to) {
    logger.warn("No admin email configured — approval request not sent");
    return false;
  }
  const html = shell(`
    <p style="font-size:15px"><strong>New membership application</strong> needs your review.</p>
    <table style="border-collapse:collapse;margin:12px 0">
      ${row("Name", app.name)}
      ${row("Email", app.email)}
      ${row("Phone", app.phone)}
      ${row("Date of birth", app.dob)}
      ${row("Position", app.position)}
      ${row("Message", app.message)}
    </table>
    <a href="${adminPanelUrl()}"
       style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;margin-top:8px">
      Review &amp; approve
    </a>
    <p style="font-size:13px;color:#888;margin-top:16px">Open the admin panel to accept or reject this application.</p>
  `);
  return send({
    from: ksbFrom(),
    to,
    replyTo: app.email,
    subject: `New KSB application — ${app.name}`,
    html,
    context: "admin_approval_request",
  });
}

// 3. Sent to the applicant once the admin approves — no-reply.
export async function sendApplicationApproved(app: ClubApplication): Promise<boolean> {
  const html = shell(`
    <p style="font-size:15px">Hi ${app.name},</p>
    <p style="font-size:15px;line-height:1.6">
      Great news — your application has been <strong style="color:#16a34a">approved</strong> and
      you've officially joined <strong>Kokkola Soccer Boys</strong>! Welcome to the team.
    </p>
    <p style="font-size:15px;line-height:1.6">
      We'll reach out with details about training, kit, and upcoming fixtures soon.
    </p>
    <p style="font-size:13px;color:#888;margin-top:24px">
      This is an automated message from a no-reply address — please do not reply.
    </p>
  `);
  return send({
    from: noReplyFrom(),
    to: app.email,
    subject: "You're in! Welcome to Kokkola Soccer Boys",
    html,
    context: "application_approved",
  });
}
