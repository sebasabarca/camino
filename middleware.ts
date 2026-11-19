import { NextResponse, type NextRequest } from "next/server";
import { authConfig, COOKIE, verify } from "@/lib/auth";

// Every page and server action needs a login; /admin needs the owner's. Icons, the manifest and the login page don't.
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const cfg = authConfig();
  if (!cfg.ready) {
    // dev without passwords is open; a production server without them refuses rather than run open
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Login is not configured: set APP_PASSWORD, OWNER_PASSWORD and AUTH_SECRET (see app/CLAUDE.md).", { status: 503 });
  }
  if (pathname === "/login") return NextResponse.next();
  const role = await verify(req.cookies.get(COOKIE)?.value, cfg.secret);
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && role !== "owner") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon-|manifest.webmanifest|mushroom/).*)"],
};
