import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

const KSB_NAME = "Kokkola Soccer Boys";
const DEFAULT_FROM = "ksoccerboys@gmail.com";

let cachedTransporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;
  const host = process.env["SMTP_HOST"];
  if (!host) {
    logger.warn("SMTP_HOST not set — outgoing emails disabled");
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

function adminPanelUrl(path = "/admin/club-applications"): string {
  const domain = (process.env["REPLIT_DOMAINS"] || "").split(",")[0]?.trim();
  if (!domain) return path;
  return `https://${domain}${path}`;
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

// Escape user/admin-provided values before embedding them in HTML emails.
function esc(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value?: string | null): string {
  if (!value) return "";
  return `<tr><td style="padding:4px 12px 4px 0;color:#666;font-size:14px;vertical-align:top">${label}</td><td style="padding:4px 0;font-size:14px;font-weight:600">${esc(value)}</td></tr>`;
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

export interface TeamRegistration {
  id: number;
  name: string;
  shortName?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
  managerPhone?: string | null;
  city?: string | null;
  category?: string | null;
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
    <p style="font-size:15px">Hi ${esc(app.name)},</p>
    <p style="font-size:15px;line-height:1.6">
      Thanks for applying to join <strong>Kokkola Soccer Boys</strong>! We've received your
      application and our team will review it shortly. We'll be in touch at this email address
      with the next steps.
    </p>
    <p style="font-size:13px;color:#888;margin-top:24px">
      This is an automated message from a no-reply address — please do not reply.
    </p>
  `);
  return send({
    from: noReplyFrom(),
    to: app.email,
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
    <p style="font-size:15px">Hi ${esc(app.name)},</p>
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

// 4. Sent to the applicant once the admin rejects — no-reply.
export async function sendApplicationRejected(app: ClubApplication, note?: string | null): Promise<boolean> {
  const html = shell(`
    <p style="font-size:15px">Hi ${esc(app.name)},</p>
    <p style="font-size:15px;line-height:1.6">
      Thank you for your interest in joining <strong>Kokkola Soccer Boys</strong>. After
      reviewing your application, we're unable to offer you a place at this time.
    </p>
    ${note ? `<p style="font-size:14px;line-height:1.6;color:#444;background:#f5f5f5;border-radius:8px;padding:12px 16px">${esc(note)}</p>` : ""}
    <p style="font-size:15px;line-height:1.6">
      We genuinely appreciate you reaching out and encourage you to apply again in the future.
    </p>
    <p style="font-size:13px;color:#888;margin-top:24px">
      This is an automated message from a no-reply address — please do not reply.
    </p>
  `);
  return send({
    from: noReplyFrom(),
    to: app.email,
    subject: "Update on your application — Kokkola Soccer Boys",
    html,
    context: "application_rejected",
  });
}

// 5. Sent to the team manager right after they submit their squad — from the KSB email.
export async function sendSquadSubmissionConfirmation(team: TeamRegistration): Promise<boolean> {
  if (!team.managerEmail) {
    logger.warn({ teamId: team.id }, "No manager email — squad confirmation not sent");
    return false;
  }
  const html = shell(`
    <p style="font-size:15px">Hi ${esc(team.managerName || "there")},</p>
    <p style="font-size:15px;line-height:1.6">
      Thanks for registering <strong>${esc(team.name)}</strong> for the Ostrobothnia Nepal Super
      League 2026! We've received your squad and our organisers will review it shortly. You'll
      get an email as soon as it's approved and live on the tournament site.
    </p>
    <p style="font-size:13px;color:#888;margin-top:24px">
      This is an automated message from a no-reply address — please do not reply.
    </p>
  `);
  return send({
    from: noReplyFrom(),
    to: team.managerEmail,
    subject: `We received your team registration — ${team.name}`,
    html,
    context: "squad_submission_confirmation",
  });
}

// 6. Approval request sent to the admin when a new squad is submitted.
export async function sendAdminSquadApprovalRequest(team: TeamRegistration): Promise<boolean> {
  const to = adminEmail();
  if (!to) {
    logger.warn("No admin email configured — squad approval request not sent");
    return false;
  }
  const html = shell(`
    <p style="font-size:15px"><strong>A team squad</strong> needs your review.</p>
    <table style="border-collapse:collapse;margin:12px 0">
      ${row("Team", team.name)}
      ${row("Short name", team.shortName)}
      ${row("Manager", team.managerName)}
      ${row("Email", team.managerEmail)}
      ${row("Phone", team.managerPhone)}
      ${row("City", team.city)}
      ${row("Category", team.category)}
    </table>
    <a href="${adminPanelUrl("/admin/teams")}"
       style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;margin-top:8px">
      Review &amp; approve
    </a>
    <p style="font-size:13px;color:#888;margin-top:16px">Open the admin panel to approve or send this squad back for changes.</p>
  `);
  return send({
    from: ksbFrom(),
    to,
    ...(team.managerEmail ? { replyTo: team.managerEmail } : {}),
    subject: `New squad submitted — ${team.name}`,
    html,
    context: "admin_squad_approval_request",
  });
}

// 7. Sent to the team manager once the admin approves the squad — no-reply.
export async function sendSquadApproved(team: TeamRegistration): Promise<boolean> {
  if (!team.managerEmail) {
    logger.warn({ teamId: team.id }, "No manager email — squad approval email not sent");
    return false;
  }
  const html = shell(`
    <p style="font-size:15px">Hi ${esc(team.managerName || "there")},</p>
    <p style="font-size:15px;line-height:1.6">
      Great news — <strong>${esc(team.name)}</strong>'s squad has been
      <strong style="color:#16a34a">approved</strong> and is now live on the tournament site.
    </p>
    <p style="font-size:15px;line-height:1.6">
      We'll be in touch with details about fixtures and match days. Good luck this season!
    </p>
    <p style="font-size:13px;color:#888;margin-top:24px">
      This is an automated message from a no-reply address — please do not reply.
    </p>
  `);
  return send({
    from: noReplyFrom(),
    to: team.managerEmail,
    subject: `Your squad is approved — ${team.name}`,
    html,
    context: "squad_approved",
  });
}

// 8. Sent to the team manager when the admin sends the squad back / removes approval — no-reply.
export async function sendSquadRejected(team: TeamRegistration): Promise<boolean> {
  if (!team.managerEmail) {
    logger.warn({ teamId: team.id }, "No manager email — squad rejection email not sent");
    return false;
  }
  const html = shell(`
    <p style="font-size:15px">Hi ${esc(team.managerName || "there")},</p>
    <p style="font-size:15px;line-height:1.6">
      We've reviewed <strong>${esc(team.name)}</strong>'s squad and it needs some changes before it
      can be approved. Please sign in, update your squad, and resubmit it for approval.
    </p>
    <p style="font-size:15px;line-height:1.6">
      If you have any questions, contact the tournament organisers.
    </p>
    <p style="font-size:13px;color:#888;margin-top:24px">
      This is an automated message from a no-reply address — please do not reply.
    </p>
  `);
  return send({
    from: noReplyFrom(),
    to: team.managerEmail,
    subject: `Action needed on your squad — ${team.name}`,
    html,
    context: "squad_rejected",
  });
}
