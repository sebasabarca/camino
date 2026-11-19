import Link from "next/link";
import { fixesToShow, practiceSet } from "@/lib/help";
import { LEARNER } from "@/lib/learner";
import { LessonPlayer } from "@/components/lesson-player";
import { MushroomSays } from "@/components/mushroom";

export const dynamic = "force-dynamic";

// Spaced review: up to 12 exercises from finished lessons that are due again, missed ones first.
export default function Practicar() {
  const { steps } = practiceSet(LEARNER.id);
  if (!steps.length)
    return (
      <div className="flex min-h-dvh flex-col px-5 pb-28 pt-[max(env(safe-area-inset-top),1.5rem)]">
        <h1 className="text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">Repaso</h1>
        <div className="mt-8">
          <MushroomSays mood="proud">
            Nada que repasar por ahora. Lo que aprendes vuelve aquí uno o dos días después de cada lección.
          </MushroomSays>
        </div>
        <Link href="/" className="pill mt-8 w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none">
          Ir al camino
        </Link>
      </div>
    );
  return <LessonPlayer activityId="practica" steps={steps} mode="practice" doneHref="/practicar/hecho" exitHref="/repasar" fixes={fixesToShow(LEARNER.id)} />;
}
