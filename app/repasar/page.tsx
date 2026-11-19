import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { learnedPhrases } from "@/lib/course";
import { practiceSet, PRACTICE_SIZE } from "@/lib/help";
import { LEARNER } from "@/lib/learner";
import { MushroomSays } from "@/components/mushroom";
import { SayAll, SayRow } from "@/components/say-it";

export const dynamic = "force-dynamic";

// Her phrasebook: everything she has met so far, by situation, ready to hear again.
export default function Repasar() {
  const groups = learnedPhrases();
  const total = groups.reduce((k, g) => k + g.items.length, 0);
  const due = practiceSet(LEARNER.id);
  const n = Math.min(due.dueItems, PRACTICE_SIZE);

  return (
    <div className="px-5 pb-28 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <h1 className="text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">Repasar</h1>

      {total > 0 && (
        <section aria-labelledby="practicar" className="card mt-5 flex flex-col gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-terra-wash text-terra-deep">
              <RotateCcw className="size-5" strokeWidth={2.4} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="practicar" className="text-[19px] font-bold leading-7 text-espresso">Practicar</h2>
              <p className="text-[15px] leading-[22px] text-pebble">
                {n > 0
                  ? <><span className="tabular font-semibold text-espresso">{n}</span> {n === 1 ? "ejercicio" : "ejercicios"} para hoy{due.missed > 0 ? (due.missed === 1 ? ", 1 que se te resistió" : `, ${due.missed} que se te resistieron`) : ""}.</>
                  : "Todo al día. Vuelve mañana."}
              </p>
            </div>
          </div>
          {n > 0 && (
            <Link href="/practicar" className="pill w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none">
              Empezar repaso
            </Link>
          )}
        </section>
      )}

      {total === 0 ? (
        <div className="mt-8">
          <MushroomSays mood="curious">
            Aún no hay frases aquí. Termina tu primera lección y empiezan a aparecer, listas para oírlas otra vez.
          </MushroomSays>
          <Link href="/" className="pill mt-6 w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none">
            Ir al camino
          </Link>
        </div>
      ) : (
        <>
          <h2 className="mt-8 text-[22px] font-bold leading-8 tracking-[-0.01em] text-espresso">Tus frases</h2>
          <p className="mt-1 text-[15px] leading-[22px] text-pebble">
            <span className="tabular font-semibold text-espresso">{total}</span> frases de tus lecciones. Toca una para oírla.
          </p>
          {groups.map((g) => (
            <section key={g.unit.id} aria-labelledby={`g-${g.unit.id}`} className="mt-7">
              <div className="flex items-center justify-between gap-3">
                <h2 id={`g-${g.unit.id}`} className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-espresso">{g.unit.title}</h2>
                <SayAll texts={g.items.map((i) => i.spanish)} label={`Escuchar todas: ${g.unit.title}`} />
              </div>
              <ul className="card mt-3 divide-y divide-[rgba(74,52,42,0.08)] px-5">
                {g.items.map((i) => (
                  <li key={i.id}>
                    <SayRow spanish={i.spanish} gloss={i.gloss} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
