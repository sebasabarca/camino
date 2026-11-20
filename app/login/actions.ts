"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig, COOKIE, MAX_AGE, same, sign, type Role } from "@/lib/auth";
import { clientIp, LoginLimiter, safeNext } from "@/lib/login-guard";

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const g = globalThis as unknown as { loginLimiter?: LoginLimiter };
const limiter = (g.loginLimiter ??= new LoginLimiter());

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const cfg = authConfig();
  const h = await headers();
  const ip = clientIp(h.get("x-forwarded-for"));
  const pw = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));

  // Throttled: answer the same way whatever the password, so a blocked caller learns nothing.
  if (limiter.retryAfter(ip) > 0) {
    await pause(1200);
    return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
  }
  const role: Role | null = cfg.ready && pw ? (same(pw, cfg.owner) ? "owner" : same(pw, cfg.learner) ? "learner" : null) : null;
  if (!role) {
    limiter.fail(ip);
    await pause(1200); // slows guessing
    return "Esa contraseña no es. Inténtalo otra vez.";
  }
  limiter.succeed(ip);
  const https = h.get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, await sign(role, cfg.secret), { httpOnly: true, sameSite: "lax", secure: https, path: "/", maxAge: MAX_AGE });
  redirect(next);
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}
