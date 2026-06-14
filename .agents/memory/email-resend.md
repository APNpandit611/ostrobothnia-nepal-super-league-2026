---
name: Email delivery via SMTP (Spacemail)
description: How transactional email is sent (authenticated Spacemail SMTP), why Gmail and Resend were both abandoned, and what to check when mail stops.
---

# Email delivery via SMTP (Spacemail)

All transactional/notification email (club applications, squad submissions, approve/deny notices, OTP) is sent through **authenticated SMTP via `nodemailer`** using the club's **Spacemail** mailbox. A single cached transport is built in `artifacts/api-server/src/lib/mailer.ts` (`getTransporter()` + exported `send()`); `otp.ts` imports and reuses that same `send()`.

Config (env): `SMTP_HOST=mail.spacemail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true` (implicit TLS on 465; STARTTLS otherwise), `SMTP_USER=info@kokkolasoccerboys.cc`, `SMTP_PASS` (secret = that mailbox's password), `MAIL_FROM=info@kokkolasoccerboys.cc`.

## Why this setup (two earlier approaches failed)
**Why:**
- **Gmail SMTP does not work from this cloud environment.** Outbound connections to Gmail's SMTP time out / get blocked from the cloud IP (port 25 is blocked outright; the original `smtp.gmail.com:587` setup never delivered). This is environment-level, not a credentials problem.
- **Resend HTTP API was abandoned** because Resend only sends from a *verified* domain. `kokkolasoccerboys.cc` was never verified on the Resend account, so sends to anyone but the account owner returned **403 "domain is not verified"**.
- **Spacemail SMTP works:** `mail.spacemail.com` ports **465 and 587 are reachable** from here (verified by a TCP/AUTH probe); 25 and `smtp.spacemail.com` are blocked. Sending from the real mailbox aligns with the domain's existing SPF (`include:spf.spacemail.com`), so deliverability is good.

**How to apply:** If the user reports "no email arrives": (1) it's almost never the code — first confirm `SMTP_PASS` still matches the current `info@kokkolasoccerboys.cc` mailbox password (a mailbox password change silently breaks auth → look for an SMTP auth error in api-server logs); (2) the `from` address must be the authenticated mailbox or an alias it may send as, or Spacemail rejects the message — keep `MAIL_FROM` aligned with `SMTP_USER`. Do NOT reintroduce Gmail SMTP or assume Resend will deliver to arbitrary recipients.

## Determining a domain's real mail host
The domain's MX records point to the actual provider (here `mx1/mx2.spacemail.com` → Spacemail/Spaceship). `dig` is not installed in the env; resolve MX with Node's `dns.promises.resolveMx` inside `code_execution`. The `code_execution` sandbox does NOT have project secrets injected (`process.env.SMTP_PASS` is empty there) — verify credentials against the *running* server (e.g. hit the OTP send endpoint and read logs), not from the sandbox.

## Admin recipient
`adminEmail()` in mailer.ts resolves `ADMIN_EMAIL || SMTP_USER || from-address`. With `SMTP_USER=info@kokkolasoccerboys.cc`, admin notices (new application / new squad) now go to the club's real Spacemail inbox. Proper long-term option: a dedicated `ADMIN_EMAIL`.
