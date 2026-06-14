import { createHmac, timingSafeEqual } from "node:crypto";

// Admin session cookie. The cookie value is an HMAC-signed token derived from
// SESSION_SECRET, so it cannot be forged by anyone reading the source (the old
// implementation used a static literal, which was trivially forgeable).
export const COOKIE_NAME = "nepal_admin_session";
export const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("SESSION_SECRET environment variable is required for admin sessions");
}
const sessionSecret = secret;

function sign(value: string): string {
  return createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

// Token format: "<expiresAtMs>.<hmac>"
export function createSessionToken(): string {
  const expiresAt = String(Date.now() + COOKIE_MAX_AGE_MS);
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const expiresAt = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = sign(expiresAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const exp = Number(expiresAt);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  return true;
}
