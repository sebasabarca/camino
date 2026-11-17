import { BookOpenText, Clock3, Flag, Sun } from "lucide-react";
import { learnerStats } from "@/lib/course";
import { Mushroom } from "@/components/mushroom";
import { SpeedSetting } from "@/components/say-it";

export const dynamic = "force-dynamic";

// Her page: plain facts about what she has done, and how the app talks to her. Nothing here can be lost.
export default function Yo() {
  const s = learnerStats();
  const hours = Math.floor(s.minutes / 60);
  // session length by plan, not measured time, hence "unos"
  const time = s.minutes === 0 ? "Aún nada" : hours ? `unas ${Math.round(s.minutes / 60)} h` : `unos ${s.minutes} min`;
  const rows = [
    { icon: Sun, label: "Sesiones terminadas", value: String(s.sessionsDone), tint: "text-canela" },
    { icon: Clock3, label: "Tiempo de sesiones", value: time, tint: "text-terra" },
    { icon: Flag, label: "Metas alcanzadas", value: `${s.goals} de ${s.totalGoals}`, tint: "text-agave" },
    { icon: BookOpenText, label: "Frases que conoces", value: String(s.phrases), tint: "text-terra-deep" },
  ];

  return (
    <div className="px-5 pb-28 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div className="flex items-center gap-4">
        <Mushroom mood="proud" size={84} priority />
        <div>
          <h1 className="text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">Serena</h1>
          <p className="text-[15px] leading-[22px] text-pebble">North Vancouver · aprendiendo español</p>
        </div>
      </div>

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
        <p className="mt-1 text-[15px] leading-[22px] text-pebble">Cómo te hablan Mushroom y los demás. Puedes cambiarlo en cada audio.</p>
        <div className="mt-3"><SpeedSetting /></div>
      </section>
    </div>
  );
}
