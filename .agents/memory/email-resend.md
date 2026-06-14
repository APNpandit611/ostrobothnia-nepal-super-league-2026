---
name: Email delivery via SMTP (Spacemail)
description: How/why transactional email is sent over authenticated Spacemail SMTP, the cloud constraints that ruled out Gmail and Resend, and what to check first when mail stops.
---

# Email delivery via SMTP (Spacemail)

All transactional/notification email is sent over **authenticated SMTP (`nodemailer`)** using the club's **Spacemail** mailbox (`info@kokkolasoccerboys.cc`). One shared transport is built from `SMTP_HOST/SMTP_PORT/SMTP_SECURE/SMTP_USER/SMTP_PASS/MAIL_FROM` and reused by every sender (including OTP).

## Why this approach (two earlier ones failed)
**Why:**
- **Gmail SMTP is unusable from this cloud environment** — outbound connections to Gmail's SMTP time out / are blocked. The original setup pointed at Gmail and never delivered.
- **Resend (HTTP API) was abandoned** — it only sends from a *verified* domain, and `kokkolasoccerboys.cc` was never verified, so sends to anyone but the account owner returned 403.
- **Spacemail SMTP works** — its submission ports (465/587) are reachable from here, and sending from the real mailbox aligns with the domain's existing SPF, so deliverability is good. (Port 25 is blocked.)

**How to apply — when "no email arrives":**
1. It's almost never the code. **First check `SMTP_PASS` still matches the current mailbox password** — a mailbox password change silently breaks auth (look for an SMTP auth error in the api-server logs).
2. **Keep `MAIL_FROM` aligned with `SMTP_USER`.** Spacemail rejects messages whose `from` isn't the authenticated mailbox (or an alias it may send as).
3. Don't reintroduce Gmail SMTP, and don't assume Resend will deliver to arbitrary recipients.

## Environment gotchas worth remembering
- To find a domain's real mail host, resolve its **MX records** (Spacemail shows as `*.spacemail.com`). `dig` isn't installed; use Node's `dns` in `code_execution`.
- The `code_execution` sandbox does **not** have project secrets injected, so credentials can't be verified there — verify against the *running* server (e.g. trigger a send and read the logs).
- `adminEmail()` falls back to `SMTP_USER`, so admin notices now land in the club's real inbox. A dedicated `ADMIN_EMAIL` would be the cleaner long-term option.
