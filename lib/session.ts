import "server-only";
import { cookies } from "next/headers";
import { authConfig, COOKIE, verify, type Role } from "./auth";

// Server-side session checks for pages, routes and server actions. The middleware already turns away requests without
// a valid cookie; these checks repeat it where data is read or written, so a middleware bypass (or a future matcher
// mistake) still can't touch her progress.

/** The signed-in role, or null. In development without passwords configured, the app is open (owner). */
export async function sessionRole(): Promise<Role | null> {
  const cfg = authConfig();
  if (!cfg.ready) return process.env.NODE_ENV !== "production" ? "owner" : null;
  return verify((await cookies()).get(COOKIE)?.value, cfg.secret);
}

/** True when the request comes from the owner's login (or login isn't configured, in development). */
export async function isOwner() {
  return (await sessionRole()) === "owner";
}

/** Throws unless someone is signed in (learner or owner). Use at the top of every server action that writes. */
export async function requireSession(): Promise<Role> {
  const role = await sessionRole();
  if (!role) throw new Error("Not signed in");
  return role;
}
