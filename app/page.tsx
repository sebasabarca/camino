import Link from "next/link";
import { ArrowRight, Check, Sun } from "lucide-react";
import { courseState } from "@/lib/course";
import { Mushroom } from "@/components/mushroom";

export const dynamic = "force-dynamic";

// Home: the can-do ladder. Each unit is one real-life "I can…" she climbs; the current rung is open.
export default function Home() {
  const { units, current, sessionsDone } = courseState();
  const ci = units.findIndex((u) => u.id === current.id);
  const session = current.sessions.find((s) => !s.complete) ?? current.sessions[0];
  const reached = units.filter((u) => u.complete).length;

  return (
    <div className="pb-28">
      <header className="flex items-center gap-3 px-5 pb-1 pt-[max(env(safe-area-inset-top),1rem)]">
        <Mushroom mood="friendly" size={52} priority />
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap text-[18px] font-bold leading-6 tracking-[-0.01em] text-espresso">Camino con Mushroom</p>
          <p className="font-label text-[12px] font-semibold text-pebble">Hola, Serena</p>
        </div>
        <span className="flex min-h-9 items-center gap-1.5 rounded-full bg-canela-wash px-3 font-label text-[13px] font-semibold text-canela-deep">
          <Sun className="size-4 text-canela" strokeWidth={2.5} aria-hidden />
          <span className="tabular">{sessionsDone}</span>
          <span className="sr-only">{sessionsDone === 1 ? "sesión terminada" : "sesiones terminadas"}</span>
        </span>
      </header>

      <div className="px-5 pt-4">
        <h1 className="text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">{reached === 0 ? "Lo que vas a poder hacer" : "Lo que ya puedes hacer"}</h1>
        <p className="mt-1 text-[15px] leading-[22px] text-pebble">
          {reached === 0
            ? "Seis metas reales. Una sesión a la vez."
            : `${reached} de ${units.length} metas alcanzadas. Una sesión a la vez.`}
        </p>
      </div>

      <ol className="mt-5 px-5" aria-label="Metas del curso">
        {units.map((u, i) => {
          const state = u.complete ? "done" : i === ci ? "now" : "later";
          const last = i === units.length - 1;
          // the rail segment below this rung: agave where she has already walked
          const rail = last ? null : (
            <span aria-hidden className={`absolute left-[21px] ${u.complete ? "top-9 bg-agave" : "top-11 bg-sand-deep/70"} -bottom-1 w-[3px] rounded-full`} />
          );

          if (state === "now")
            return (
              <li key={u.id} className="relative pb-4">
                {rail}
                <section aria-labelledby={`goal-${u.id}`} className="card relative -ml-1 border-terra/35 p-4 shadow-[var(--shadow-lift)]">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-terra font-label tabular text-[16px] font-bold text-white ring-8 ring-terra-wash">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 id={`goal-${u.id}`} className="text-balance text-[18px] font-extrabold leading-6 tracking-[-0.01em] text-espresso [font-feature-settings:normal]">
                        {u.goal}
                      </h2>
                      <p className="mt-1 font-label text-[12px] font-semibold text-pebble">{u.title}</p>
                    </div>
                  </div>
                  <ol className="mt-4 flex gap-1.5" aria-label="Sesiones de esta meta">
                    {u.sessions.map((s, k) => (
                      <li key={s.id} className="flex-1">
                        <span className="sr-only">Sesión {k + 1}: {s.complete ? "terminada" : s.id === session.id ? "ahora" : "pendiente"}</span>
                        <span aria-hidden className={`block h-2.5 rounded-full ${s.complete ? "bg-agave" : s.id === session.id ? "bg-terra" : "bg-sand"}`} />
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 font-label text-[12px] font-semibold text-pebble">
                    Sesión {session.ord + 1} de {u.sessions.length} · {session.title} · {session.minutes} min
                  </p>
                  <Link
                    href={`/learn/${session.nextId}`}
                    className="pill mt-4 w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none"
                  >
                    {u.finished > 0 ? "Continuar" : "Empezar"} <ArrowRight className="size-5" />
                  </Link>
                  <Link href={`/unit/${u.id}`} className="mt-1 flex min-h-11 items-center justify-center font-label text-[14px] font-semibold text-terra-deep">
                    Ver las {u.sessions.length} sesiones
                  </Link>
                </section>
              </li>
            );

          return (
            <li key={u.id} className={`relative ${state === "done" ? "pb-3" : "pb-4"}`}>
              {rail}
              <Link href={`/unit/${u.id}`} className="group flex items-start gap-3.5 rounded-[1.25rem] py-0.5">
                <span
                  className={`relative grid shrink-0 place-items-center rounded-full font-label tabular text-[15px] font-bold transition group-active:translate-y-0.5 ${
                    state === "done" ? "mx-1 size-9 bg-agave text-white shadow-[var(--shadow-card)]" : "size-11 border-[1.5px] border-sand-deep bg-crema-low text-pebble"
                  }`}
                >
                  {state === "done" ? <Check className="size-5" strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className={`block truncate text-[16px] leading-6 ${state === "done" ? "font-semibold text-agave-deep" : "font-medium text-pebble"}`}>{u.title}</span>
                  <span className="block font-label text-[12px] font-semibold text-pebble">
                    {state === "done" ? "Meta alcanzada" : u.finished > 0 ? `${u.finished} de ${u.count} actividades` : "Después"}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
