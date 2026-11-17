import Link from "next/link";
import { ArrowRight, AudioLines, CalendarHeart, Check, Coffee, Hand, Sun, Users, type LucideIcon } from "lucide-react";
import { courseState } from "@/lib/course";
import { Mushroom } from "@/components/mushroom";

export const dynamic = "force-dynamic";

const ICON: Record<string, LucideIcon> = { "p0-sounds-01": AudioLines, "p0-u01": Hand, "a1-u01": Users, "a1-u02": Sun, "a1-u03": Coffee, "a1-u04": CalendarHeart };
// stones wander left and right along the trail (x in % of the column)
const X = [50, 74, 50, 26, 50, 74, 50, 26];
const ROW = 176;

export default function Camino() {
  const { units, current, sessionsDone } = courseState();
  const session = current.sessions.find((s) => !s.complete) ?? current.sessions[0];
  const ci = units.findIndex((u) => u.id === current.id);
  const pts = units.map((_, i) => ({ x: X[i % X.length], y: i * ROW + 48 }));
  // Trail dots: sample each curve from below one stone's label to above the next stone, evenly by arc length
  // in a nominal 350px-wide column, then place them in % horizontally so they stay round at any width.
  const dots = pts.slice(1).flatMap((p, i) => {
    // centre to centre; stones and the labels' crema backing sit on top and hide the dots beneath them
    const a = { x: pts[i].x * 3.5, y: pts[i].y }, b = { x: p.x * 3.5, y: p.y };
    const at = (t: number) => {
      const u = 1 - t, c1 = { x: a.x, y: a.y + ROW * 0.55 }, c2 = { x: b.x, y: b.y - ROW * 0.55 };
      return { x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y };
    };
    const samples = Array.from({ length: 41 }, (_, k) => at(k / 40));
    const lens = samples.map((q, k) => (k ? Math.hypot(q.x - samples[k - 1].x, q.y - samples[k - 1].y) : 0)).map((_, k, arr) => arr.slice(0, k + 1).reduce((x, y) => x + y, 0));
    const n = Math.max(2, Math.round(lens[40] / 16));
    return Array.from({ length: n + 1 }, (_, k) => {
      const target = (k / n) * lens[40];
      const j = lens.findIndex((l) => l >= target);
      return { x: samples[j].x / 3.5, y: samples[j].y, walked: i < ci };
    });
  }).filter((d) =>
    // keep the trail clear of every stone (radius + halo) and the label under it, in the nominal 350px space
    pts.every((p, k) => {
      const r = k === ci ? 54 : 40;
      const dx = (d.x - p.x) * 3.5, dy = d.y - p.y;
      const inStone = Math.hypot(dx, dy) < r;
      const inLabel = Math.abs(dx) < 58 && dy > 0 && dy < r + 50;
      return !inStone && !inLabel;
    }),
  );
  const height = (units.length - 1) * ROW + 120;

  return (
    <div className="pb-16">
      <header className="flex items-center gap-3 px-5 pb-2 pt-[max(env(safe-area-inset-top),1rem)]">
        <Mushroom mood="friendly" size={52} priority />
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-bold leading-6 tracking-[-0.01em] text-espresso">Camino con Mushroom</p>
          <p className="font-label text-[12px] font-semibold text-pebble">Hola, Serena</p>
        </div>
        <span className="flex min-h-9 items-center gap-1.5 rounded-full bg-canela-wash px-3 font-label text-[13px] font-semibold text-canela-deep">
          <Sun className="size-4 text-canela" strokeWidth={2.5} />
          <span className="tabular">{sessionsDone}</span> {sessionsDone === 1 ? "sesión" : "sesiones"}
        </span>
      </header>

      <section aria-labelledby="now" className="card mx-5 mt-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 id="now" className="text-balance text-[26px] font-extrabold leading-8 tracking-[-0.02em] text-espresso">{current.title}</h1>
          {(() => { const I = ICON[current.id] ?? Sun; return <I className="mt-1 size-7 shrink-0 text-terra" strokeWidth={2} aria-hidden />; })()}
        </div>
        <p className="mt-2 text-[15px] leading-[22px] text-pebble">{current.goal}</p>
        <ol className="mt-5 flex gap-1.5" aria-label="Sesiones de esta unidad">
          {current.sessions.map((s, i) => (
            <li key={s.id} className="flex-1">
              <span className="sr-only">Sesión {i + 1}: {s.complete ? "terminada" : s.id === session.id ? "ahora" : "pendiente"}</span>
              <span aria-hidden className={`block h-2.5 rounded-full ${s.complete ? "bg-agave" : s.id === session.id ? "bg-terra" : "bg-sand"}`} />
            </li>
          ))}
        </ol>
        <p className="mt-2 font-label text-[12px] font-semibold text-pebble">
          Sesión {session.ord + 1} de {current.sessions.length} · {session.title}
        </p>
        <Link
          href={`/learn/${session.nextId}`}
          className="pill mt-5 w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none"
        >
          {session.finished > 0 ? "Continuar" : "Empezar"} <ArrowRight className="size-5" />
        </Link>
      </section>

      <nav aria-label="El camino" className="relative mx-5 mt-8" style={{ height }}>
        {dots.map((d, k) => (
          <span
            key={k}
            aria-hidden
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-agave ${d.walked ? "size-2.5" : "size-2 opacity-35"}`}
            style={{ left: `${d.x}%`, top: d.y }}
          />
        ))}
        {units.map((u, i) => {
          const I = ICON[u.id] ?? Sun;
          const state = u.complete ? "done" : i === ci ? "now" : i < ci ? "open" : "later";
          return (
            <Link
              key={u.id}
              href={`/unit/${u.id}`}
              className="group absolute flex w-32 -translate-x-1/2 flex-col items-center gap-2 text-center"
              style={{ left: `${pts[i].x}%`, top: pts[i].y - (state === "now" ? 40 : 32) }}
            >
              <span
                className={`relative grid place-items-center rounded-full transition group-active:translate-y-0.5 ${
                  state === "now"
                    ? "size-20 bg-terra text-white shadow-[0_10px_24px_rgba(200,90,50,0.35)] ring-[10px] ring-terra-wash"
                    : state === "done"
                      ? "size-16 bg-agave text-white shadow-[var(--shadow-card)]"
                      : "size-16 border-[1.5px] border-sand-deep bg-crema-low text-pebble"
                }`}
              >
                <I className={state === "now" ? "size-9" : "size-7"} strokeWidth={2} aria-hidden />
                {state === "done" && (
                  <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-canela text-white ring-2 ring-crema">
                    <Check className="size-3.5" strokeWidth={3.5} />
                  </span>
                )}
              </span>
              <span className={`rounded-full bg-crema px-2.5 py-0.5 text-[14px] leading-[18px] ${state === "now" ? "font-bold text-terra-deep" : "font-semibold text-espresso"}`}>{u.title}</span>
              {state === "now" && <span className="sr-only">(ahora)</span>}
            </Link>
          );
        })}
        <Mushroom
          mood="listening"
          size={72}
          className="pointer-events-none absolute -translate-x-1/2"
          style={{ left: `${pts[ci].x > 50 ? pts[ci].x - 36 : pts[ci].x + 36}%`, top: pts[ci].y - 56 }}
        />
      </nav>
    </div>
  );
}
