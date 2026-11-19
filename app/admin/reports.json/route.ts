import { listReports } from "@/lib/db";
import { LEARNER } from "@/lib/learner";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

// Download for the pipeline when the app runs on a server:
//   python3 tools/sgo.py reports --json reports.json   (and fix-reports --json reports.json)
export async function GET() {
  if (!(await isOwner())) return new Response("Forbidden", { status: 403 });
  return Response.json(
    { exported_at: new Date().toISOString(), reports: listReports(LEARNER.id) },
    { headers: { "Content-Disposition": 'attachment; filename="reports.json"' } },
  );
}
