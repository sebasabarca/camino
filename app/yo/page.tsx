import Link from "next/link";
import { BookOpenText, Brain, Flag, GraduationCap, Target } from "lucide-react";
import { learnerStats } from "@/lib/course";
import { Mushroom } from "@/components/mushroom";
import { SpeedSetting } from "@/components/say-it";

export const dynamic = "force-dynamic";

// Her page: plain facts about what she has done, and how the app talks to her. Nothing here can be lost:
// no streaks; the daily goal starts fresh each day and missing it costs nothing.
export default function Yo() {
  const s = learnerStats();
  const rows = [
    { icon: GraduationCap, label: "Lecciones terminadas", value: String(s.lessons), tint: "text-terra" },
    { icon: BookOpenText, label: "Palabras y frases", value: String(s.phrases), tint: "text-terra-deep" },
    { icon: Target, label: "Respuestas a la primera", value: s.firstTry == null ? "—" : `${s.firstTry} %`, tint: "text-canela" },
    { icon: Flag, label: "Unidades superadas", value: `${s.passed} de ${s.totalUnits}`, tint: "text-agave" },
    ...(s.remembered ? [{ icon: Brain, label: "Recordadas semanas después", value: String(s.remembered), tint: "text-agave-deep" }] : []),
  ];
  const met = s.lessonsToday >= 1;

  return (
    <div className="px-5 pb-28 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div className="flex items-center gap-4">
        <Mushroom mood="proud" size={84} priority />
        <div>
          <h1 className="text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">Serena</h1>
          <p className="text-[15px] leading-[22px] text-pebble">North Vancouver · aprendiendo español</p>
        </div>
      </div>

      <section aria-labelledby="hoy" className={`mt-8 rounded-[1.5rem] px-5 py-4 ${met ? "bg-agave-wash" : "bg-canela-wash"}`}>
        <h2 id="hoy" className={`text-[19px] font-bold leading-7 ${met ? "text-agave-deep" : "text-canela-deep"}`}>
          {met ? "Meta de hoy cumplida" : "Meta de hoy: una lección"}
        </h2>
        <p className="mt-0.5 text-[15px] leading-[22px] text-espresso">
          {met
            ? `${s.lessonsToday} ${s.lessonsToday === 1 ? "lección" : "lecciones"} hoy. Lo demás es extra.`
            : "Unos seis minutos. Si hoy no puedes, no pasa nada."}
        </p>
        {!met && (
          <Link href="/" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-white px-4 font-label text-[14px] font-bold text-terra-deep shadow-[var(--shadow-card)]">
            Ir al camino
          </Link>
        )}
      </section>

      <section aria-labelledby="hecho" className="mt-8">
        <h2 id="hecho" className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-espresso">Lo que llevas</h2>
        <ul className="card mt-3 divide-y divide-[rgba(74,52,42,0.08)] px-5">
          {rows.map((r) => (
            <li key={r.label} className="flex min-h-14 items-center gap-3 py-3">
              <r.icon className={`size-5 shrink-0 ${r.tint}`} strokeWidth={2.25} aria-hidden />
              <span className="flex-1 text-[16px] leading-6 text-espresso">{r.label}</span>
              <span className="font-label tabular text-[16px] font-bold text-espresso">{r.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="voz" className="mt-8">
        <h2 id="voz" className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-espresso">Voz</h2>
        <p className="mt-1 text-[15px] leading-[22px] text-pebble">La velocidad de la voz cuando tocas el altavoz.</p>
        <div className="mt-3"><SpeedSetting /></div>
      </section>
    </div>
  );
}
