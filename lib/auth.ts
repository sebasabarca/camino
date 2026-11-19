// Login for a private, one-learner app. Two passwords from the environment:
//   APP_PASSWORD   Serena (role "learner")
//   OWNER_PASSWORD the course owner (role "owner": everything, plus /admin)
// A successful login sets a signed cookie for a year (HMAC-SHA256 with AUTH_SECRET), so she logs in once per phone.
// Edge-safe (Web Crypto only): the middleware verifies the cookie on every request, server actions included.

export type Role = "learner" | "owner";
export const COOKIE = "camino_session";
export const MAX_AGE = 365 * 24 * 3600; // seconds

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(data: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Equal-time string comparison (no early exit on the first differing character). */
export function same(a: string, b: string) {
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

export function authConfig() {
  const secret = process.env.AUTH_SECRET ?? "";
  const learner = process.env.APP_PASSWORD ?? "";
  const owner = process.env.OWNER_PASSWORD ?? "";
  return { secret, learner, owner, ready: secret.length >= 32 && learner.length >= 8 && owner.length >= 8 };
}

export async function sign(role: Role, secret: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + MAX_AGE;
  const body = `${role}.${exp}`;
  return `${body}.${await hmac(body, secret)}`;
}

export async function verify(token: string | undefined, secret: string, now = Date.now()): Promise<Role | null> {
  if (!token || !secret) return null;
  const [role, exp, sig] = token.split(".");
  if ((role !== "learner" && role !== "owner") || !exp || !sig) return null;
  if (Number(exp) * 1000 < now) return null;
  return same(sig, await hmac(`${role}.${exp}`, secret)) ? role : null;
}
