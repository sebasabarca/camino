// Home: the sendero (winding lesson path). Same data as lib/course.ts, Sol & Sombra tokens, Mushroom cut-outs.
import Link from "next/link";
import { Brain, Check, ChevronRight, Star, Sun } from "lucide-react";
import type { courseState } from "@/lib/course";
import { Mushroom } from "./mushroom";

type State = ReturnType<typeof courseState>;
type Unit = State["units"][number];
type Lesson = Unit["sessions"][number];
export type HomeData = State;

const isCheck = (s: Lesson) => s.title === "Prueba de la unidad";
const nextLesson = (u: Unit) => u.sessions.find((s) => !s.complete) ?? u.sessions[0];

function Header({ chip }: { chip?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-5 pb-1 pt-[max(env(safe-area-inset-top),1rem)]">
      <Mushroom mood="friendly" size={52} priority />
      <div className="min-w-0 flex-1">
        <p className="whitespace-nowrap text-[18px] font-bold leading-6 tracking-[-0.01em] text-espresso">Camino con Mushroom</p>
        <p className="font-label text-[12px] font-semibold text-pebble">Hola, Serena</p>
      </div>
      {chip}
    </header>
  );
}

const SWAY = [0, 56, 84, 56, 0, -56, -84, -56]; // px offsets from centre, repeating

export function HomePath({ d }: { d: HomeData }) {
  return (
    <div className="overflow-x-hidden pb-28">
      <Header
        chip={
          // today's goal: one lesson. It starts fresh every day; nothing carries over or can be lost.
          d.lessonsToday > 0 ? (
            <Link href="/yo" aria-label="Meta de hoy cumplida" className="flex min-h-9 items-center gap-1.5 rounded-full bg-agave-wash px-3 font-label text-[13px] font-bold text-agave-deep">
              <Check className="size-4" strokeWidth={3} aria-hidden /> Hoy
            </Link>
          ) : (
            <Link href="/yo" aria-label="Meta de hoy: una lección, aún sin hacer" className="flex min-h-9 items-center gap-1.5 rounded-full bg-canela-wash px-3 font-label text-[13px] font-semibold text-canela-deep">
              <Sun className="size-4 text-canela" strokeWidth={2.5} aria-hidden /> Hoy <span className="tabular">0/1</span>
            </Link>
          )
        }
      />
      {d.delayed.filter((c) => c.due && !c.done).map((c) => (
        <Link
          key={c.id}
          href={`/prueba/${c.id}`}
          className="mx-5 mt-4 flex items-center gap-3 rounded-[1.5rem] bg-white px-4 py-4 shadow-[var(--shadow-card)] active:translate-y-0.5"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-agave-wash text-agave-deep">
            <Brain className="size-5" strokeWidth={2.3} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold leading-6 text-espresso">¿Aún lo recuerdas?</span>
            <span className="block text-[14px] leading-5 text-pebble">
              {c.unitTitle} · {c.minutes ?? 5} min, sin ayudas
            </span>
          </span>
          <ChevronRight className="size-5 text-pebble" aria-hidden />
        </Link>
      ))}
      {d.units.map((u, ui) => {
        const next = u.id === d.current.id ? nextLesson(u) : undefined;
        const later = !u.complete && u.id !== d.current.id;
        return (
          <section key={u.id} aria-labelledby={`u-${u.id}`} className="mt-5">
            <div className={`mx-5 rounded-[1.5rem] px-5 py-4 ${u.complete ? "bg-agave" : later ? "bg-sand" : "bg-terra"} `}>
              <p className={`font-label text-[12px] font-bold ${later ? "text-pebble" : "text-white/85"}`}>Unidad {ui + 1}</p>
              <h2 id={`u-${u.id}`} className={`text-[20px] font-extrabold leading-7 ${later ? "text-pebble" : "text-white"}`}>{u.title}</h2>
            </div>
            <ol className="relative mt-14 flex flex-col items-center gap-5" aria-label={`Lecciones de ${u.title}`}>
              {u.sessions.map((s, i) => {
                const now = s.id === next?.id;
                const check = isCheck(s);
                const x = SWAY[i % SWAY.length];
                return (
                  <li key={s.id} className="relative" style={{ transform: `translateX(${x}px)` }}>
                    <Link
                      href={later ? `/unit/${u.id}` : `/learn/${s.nextId}`}
                      aria-label={`${check ? "Prueba de la unidad" : s.title}${s.complete ? ", terminada" : now ? ", ahora" : ""}`}
                      className={`grid size-[4.5rem] place-items-center rounded-full transition active:translate-y-1 ${
                        s.complete
                          ? "bg-agave text-white shadow-[inset_0_-5px_0_rgba(0,0,0,0.18)]"
                          : now
                            ? "bg-terra text-white shadow-[inset_0_-5px_0_#7a2a0c] ring-8 ring-terra-wash"
                            : "bg-sand-deep/60 text-pebble shadow-[inset_0_-5px_0_rgba(44,34,30,0.10)]"
                      }`}
                    >
                      {s.complete ? <Check className="size-8" strokeWidth={3} /> : check ? <Star className="size-8" /> : now ? <Star className="size-8 fill-white" /> : <span className="font-label tabular text-[22px] font-bold">{i + 1}</span>}
                    </Link>
                    {now && (
                      <span className="absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[0.9rem] bg-white px-3 py-1.5 font-label text-[13px] font-bold text-terra-deep shadow-[var(--shadow-card)]">
                        {s.title}
                      </span>
                    )}
                    {now && <Mushroom mood="curious" size={84} className="absolute -right-28 top-0" />}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
