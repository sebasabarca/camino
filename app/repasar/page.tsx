import Link from "next/link";
import { learnedPhrases } from "@/lib/course";
import { MushroomSays } from "@/components/mushroom";
import { SayAll, SayRow } from "@/components/say-it";

export const dynamic = "force-dynamic";

// Her phrasebook: everything she has met so far, by situation, ready to hear again.
export default function Repasar() {
  const groups = learnedPhrases();
  const total = groups.reduce((k, g) => k + g.items.length, 0);

  return (
    <div className="px-5 pb-28 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <h1 className="text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">Tus frases</h1>

      {total === 0 ? (
        <div className="mt-8">
          <MushroomSays mood="curious">
            Aún no hay frases aquí. Termina tu primera actividad y empiezan a aparecer, listas para oírlas otra vez.
          </MushroomSays>
          <Link href="/" className="pill mt-6 w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none">
            Ir al camino
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-[15px] leading-[22px] text-pebble">
            <span className="tabular font-semibold text-espresso">{total}</span> frases de tus sesiones. Toca una para oírla.
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
