// Placeholder: proves the content DB is wired up. The real design comes next.
import { listUnits, getUnitOutline } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const units = listUnits({ pilotOnly: true });
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Pilot units</h1>
      <ol className="mt-4 space-y-3">
        {units.map((u) => {
          const o = getUnitOutline(u.id)!;
          const n = o.sessions.reduce((k, s) => k + s.activities.length, 0);
          return (
            <li key={u.id} className="rounded-lg border p-4">
              <div className="font-medium">{u.title}</div>
              <div className="text-sm opacity-70">{u.goal}</div>
              <div className="mt-1 text-xs opacity-60">{o.sessions.length} sessions · {n} activities · {u.status}</div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
