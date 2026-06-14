---
name: Email delivery via Resend
description: How transactional email is sent (Resend HTTP API), and the domain-verification gotcha that blocks real delivery.
---

# Email delivery via Resend

All transactional/notification email (club applications, squad submissions, approve/deny notices, OTP) is sent through the **Resend HTTP API** (`POST https://api.resend.com/emails`, `Authorization: Bearer RESEND_API_KEY`). nodemailer was removed entirely.

**Why nodemailer/Gmail SMTP was dropped:** Gmail SMTP returned `535-5.7.8 Username and Password not accepted` from the cloud server. Plain Gmail account passwords don't work from cloud IPs (needs an App Password), so the SMTP path never delivered. Resend works from cloud servers.

## The blocker that makes "no email arrives" happen
**Resend only delivers from a VERIFIED sending domain.** The configured from-domain `kokkolasoccerboys.cc` is **not verified** on the Resend account. Consequences:
- Sending to arbitrary recipients (team managers, applicants, the club Gmail) returns **403 `validation_error` "domain is not verified"**.
- The ONLY address that currently accepts mail is the **Resend account owner's own email** (Resend's unverified-domain test rule). A send from `onboarding@resend.dev` to that owner address returns 200; the failing 403 response body names the allowed owner address if you need it.

**How to apply:** If the user reports notification emails still not arriving, the code is almost certainly fine — the fix is to **verify a domain at resend.com/domains** (add DNS records), then ensure the from-address uses that domain. The from-address is centralized: env `MAIL_FROM` (default `noreply@kokkolasoccerboys.cc`), resolved via `senderFrom()`/`bareAddress()` in `artifacts/api-server/src/lib/mailer.ts`. OTP in `otp.ts` uses the same `senderFrom()` helper.

## RESEND_API_KEY is a restricted send-only key
`GET https://api.resend.com/domains` returns **401 `restricted_api_key`** — this is expected and fine. The key can send; it just can't manage/list domains via API. Do not interpret that 401 as "the key is broken."

## Admin recipient
`adminEmail()` in mailer.ts resolves `ADMIN_EMAIL || SMTP_USER || from-address`. `SMTP_USER` (legacy env) still holds the club's real admin Gmail inbox, so it's kept as a fallback even though SMTP itself is gone. Removing it would route admin notices to the unmonitored no-reply address. Proper long-term fix: a dedicated `ADMIN_EMAIL` / admin-configurable recipient.
