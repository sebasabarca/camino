"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig, COOKIE, MAX_AGE, same, sign, type Role } from "@/lib/auth";

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function login(_: string | null, form: FormData): Promise<string | null> {
  const cfg = authConfig();
  const pw = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  const role: Role | null = cfg.ready && pw ? (same(pw, cfg.owner) ? "owner" : same(pw, cfg.learner) ? "learner" : null) : null;
  if (!role) {
    await pause(1200); // slows guessing
    return "Esa contraseña no es. Inténtalo otra vez.";
  }
  const https = (await headers()).get("x-forwarded-proto") === "https";
  (await cookies()).set(COOKIE, await sign(role, cfg.secret), { httpOnly: true, sameSite: "lax", secure: https, path: "/", maxAge: MAX_AGE });
  // only same-site paths: never redirect off the app
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}
