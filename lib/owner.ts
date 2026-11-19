import "server-only";
import { cookies } from "next/headers";
import { authConfig, COOKIE, verify } from "./auth";

/** True when the request comes from the owner's login (or login isn't configured, in development). */
export async function isOwner() {
  const cfg = authConfig();
  if (!cfg.ready) return process.env.NODE_ENV !== "production";
  return (await verify((await cookies()).get(COOKIE)?.value, cfg.secret)) === "owner";
}
