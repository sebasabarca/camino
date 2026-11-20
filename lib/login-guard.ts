// Login hardening, kept free of Next imports so it can be unit tested (lib/login-guard.test.ts).
//
// safeNext:     the return path after login may only be a path on this site.
// clientIp:     the caller's IP as the reverse proxy saw it.
// LoginLimiter: failed-login throttling, per IP and across all IPs.

/** A same-site path to go to after login, or "/" for anything that could leave the site. */
export function safeNext(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2000) return "/";
  // must be a rooted path; "//host" and "/\host" are protocol-relative to browsers; control chars hide tricks
  if (!raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return "/";
  const base = "http://camino.invalid";
  let u: URL;
  try {
    u = new URL(raw, base);
  } catch {
    return "/";
  }
  if (u.origin !== base) return "/";
  if (u.pathname === "/login") return "/"; // no login loops
  return u.pathname + u.search + u.hash;
}

/**
 * The client IP for rate limiting. Camino is only reachable through one reverse proxy (Caddy; no published port), and
 * Caddy sets X-Forwarded-For itself: by default it drops what an untrusted client sent and writes the peer's IP. If it
 * ever appends instead, the right-most entry is still the one Caddy added, so it is the only entry a client can't
 * forge. Left-most entries are never trusted. With no header (direct access, tests) everyone shares one bucket.
 */
export function clientIp(xForwardedFor: string | null | undefined): string {
  const parts = (xForwardedFor ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const ip = parts[parts.length - 1] ?? "";
  return /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : "unknown";
}

export type LimitOptions = {
  windowMs: number; // failures older than this are forgotten
  perIp: number; // failures from one IP within the window before it is blocked
  global: number; // failures from all IPs within the window before new logins pause (spread-out or spoofed guessing)
  maxKeys: number; // memory bound on tracked IPs
};

export const LOGIN_LIMITS: LimitOptions = { windowMs: 15 * 60_000, perIp: 5, global: 30, maxKeys: 5000 };

/**
 * In-memory sliding-window limiter. One process serves Camino (SQLite, no replicas), so memory is the right store;
 * a restart clears it, which is fine for throttling. Only failures are counted; a success clears that IP.
 */
export class LoginLimiter {
  private ips = new Map<string, number[]>();
  private all: number[] = [];
  private opt: LimitOptions;
  constructor(opt: LimitOptions = LOGIN_LIMITS) {
    this.opt = opt; // (no parameter property: node --test strips types and rejects them)
  }

  private recent(list: number[], now: number) {
    const from = now - this.opt.windowMs;
    let i = 0;
    while (i < list.length && list[i] <= from) i++;
    if (i) list.splice(0, i);
    return list;
  }

  /** Milliseconds until this IP may try again, or 0 if it may try now. */
  retryAfter(ip: string, now = Date.now()): number {
    const mine = this.recent(this.ips.get(ip) ?? [], now);
    const all = this.recent(this.all, now);
    let wait = 0;
    if (mine.length >= this.opt.perIp) wait = Math.max(wait, mine[mine.length - this.opt.perIp] + this.opt.windowMs - now);
    if (all.length >= this.opt.global) wait = Math.max(wait, all[all.length - this.opt.global] + this.opt.windowMs - now);
    return wait;
  }

  fail(ip: string, now = Date.now()) {
    const mine = this.recent(this.ips.get(ip) ?? [], now);
    mine.push(now);
    this.ips.delete(ip); // re-insert so Map order is least-recently-failed first
    this.ips.set(ip, mine.slice(-this.opt.perIp));
    this.all.push(now);
    if (this.all.length > this.opt.global) this.all.splice(0, this.all.length - this.opt.global);
    while (this.ips.size > this.opt.maxKeys) this.ips.delete(this.ips.keys().next().value as string);
  }

  succeed(ip: string) {
    this.ips.delete(ip);
  }
}
