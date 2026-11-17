import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { courseState } from "@/lib/course";
import { MushroomSays } from "@/components/mushroom";

export const dynamic = "force-dynamic";

export default async function UnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const { units } = courseState();
  const unit = units.find((u) => u.id === unitId);
  if (!unit) notFound();
  const nowId = unit.sessions.find((s) => !s.complete)?.id;

  return (
    <div className="pb-28">
      <header className="flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <Link href="/" aria-label="Volver al camino" className="grid size-12 place-items-center rounded-full text-pebble hover:bg-crema-mid">
          <ArrowLeft className="size-6" strokeWidth={2.25} />
        </Link>
      </header>

      <div className="px-5">
        <h1 className="text-balance text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">{unit.title}</h1>
        <p className="mt-2 text-[17px] leading-[26px] text-pebble">{unit.goal}</p>
        <p className="mt-3 font-label tabular text-[13px] font-semibold text-pebble">
          {unit.sessions.filter((s) => s.complete).length} de {unit.sessions.length} sesiones · unos {unit.sessions[0]?.minutes ?? 35} min cada una
        </p>

        <ol className="mt-6 flex flex-col gap-3">
          {unit.sessions.map((s, i) => {
            const now = s.id === nowId;
            return (
              <li key={s.id}>
                <Link
                  href={`/learn/${s.nextId}`}
                  className={`flex min-h-20 items-center gap-4 rounded-[1.5rem] px-4 py-4 transition active:translate-y-0.5 ${
                    now ? "card border-terra/40" : s.complete ? "bg-agave-wash" : "border border-[rgba(200,90,50,0.08)] bg-white/70"
                  }`}
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-full font-label tabular text-[15px] font-bold ${
                      s.complete ? "bg-agave text-white" : now ? "bg-terra text-white" : "bg-terra-wash text-terra-deep"
                    }`}
                  >
                    {s.complete ? <Check className="size-5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[17px] leading-6 ${now ? "font-bold text-espresso" : "font-semibold text-espresso"}`}>{s.title}</span>
                    <span className="mt-0.5 block text-[14px] leading-5 text-pebble">{s.objective}</span>
                    {s.finished > 0 && !s.complete && (
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-sand">
                        <span className="block h-full rounded-full bg-terra" style={{ width: `${(s.finished / s.count) * 100}%` }} />
                      </span>
                    )}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-pebble" />
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="mt-8">
          <MushroomSays mood={unit.complete ? "proud" : "teaching"}>
            {unit.complete
              ? "Unidad terminada. Repasa cuando quieras; yo me encargo de la comida."
              : "Una sesión al día basta. Si hoy hay poco tiempo, haz solo la primera parte."}
          </MushroomSays>
        </div>
      </div>
    </div>
  );
}
