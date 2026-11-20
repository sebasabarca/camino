import { NextResponse, type NextRequest } from "next/server";
import { authConfig, COOKIE, verify } from "@/lib/auth";

// Every page and server action needs a login; /admin needs the owner's. Icons, the manifest, the health check and the
// login page don't. Server actions and the admin route check the session again themselves (lib/session.ts).

/**
 * The public origin for redirects. Behind Caddy the Node server only knows its bind address, so req.url says
 * http://localhost:3000 (and Next refuses relative Location headers). In order:
 *   1. APP_ORIGIN (e.g. https://camino.sabarca.dev): fixed, so nothing a client sends can change it;
 *   2. the host and scheme the proxy forwarded (X-Forwarded-Host / Host, X-Forwarded-Proto), if well-formed;
 *   3. req.url (local development).
 */
function publicOrigin(req: NextRequest): string {
  const fixed = process.env.APP_ORIGIN;
  if (fixed) {
    try {
      return new URL(fixed).origin;
    } catch {
      console.error("APP_ORIGIN is not a valid URL:", fixed);
    }
  }
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim();
  const proto = (req.headers.get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https" ? "https" : "http";
  if (/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return `${proto}://${host}`;
  return req.nextUrl.origin;
}

function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, publicOrigin(req)), 307);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const cfg = authConfig();
  if (!cfg.ready) {
    // dev without passwords is open; a production server without them refuses rather than run open
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Login is not configured: set APP_PASSWORD, OWNER_PASSWORD and AUTH_SECRET (see DEPLOY.md).", { status: 503 });
  }
  if (pathname === "/login") return NextResponse.next();
  const role = await verify(req.cookies.get(COOKIE)?.value, cfg.secret);
  if (!role) return redirectTo(req, `/login?next=${encodeURIComponent(pathname + search)}`);
  if (pathname.startsWith("/admin") && role !== "owner") return redirectTo(req, "/");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon-|manifest.webmanifest|mushroom/|api/health$).*)"],
};
