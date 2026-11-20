import { healthCheck } from "@/lib/db";

export const dynamic = "force-dynamic";

// Unauthenticated (excluded in middleware.ts) and says nothing but ok / not ok: used by the Docker health check.
export function GET() {
  try {
    healthCheck();
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("health check failed:", e);
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
