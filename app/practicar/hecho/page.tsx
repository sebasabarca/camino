import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { practiceSet } from "@/lib/help";
import { LEARNER } from "@/lib/learner";
import { Mushroom } from "@/components/mushroom";

export const dynamic = "force-dynamic";

export default async function PracticeDone({ searchParams }: { searchParams: Promise<{ right?: string; of?: string }> }) {
  const q = await searchParams;
  const right = Number(q.right), of = Number(q.of);
  const scored = Number.isFinite(right) && Number.isFinite(of) && of > 0;
  const more = practiceSet(LEARNER.id).steps.length;
  return (
    <div className="flex min-h-dvh flex-col px-5 pb-32 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="flex flex-col items-center text-center">
        <Mushroom mood="proud" size={160} priority className="animate-[pop_700ms_var(--ease-out-expo)]" />
        <h1 className="mt-2 text-[32px] font-extrabold leading-10 tracking-[-0.02em] text-espresso">¡Repaso terminado!</h1>
        <p className="mt-2 max-w-[34ch] text-[17px] leading-[26px] text-pebble">
          Lo que acertaste vuelve más adelante; lo que se te resistió, en el próximo repaso.
        </p>
        {scored && (
          <p className="mt-4 rounded-full bg-agave-wash px-4 py-2 font-label text-[15px] font-bold text-agave-deep">
            <span className="tabular">{right} de {of}</span> a la primera
          </p>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-[30rem] flex-col gap-3 bg-gradient-to-t from-crema from-70% to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-8">
        {more > 0 && (
          <Link href="/practicar" className="pill w-full border-[1.5px] border-[rgba(44,34,30,0.10)] bg-white text-terra-deep active:translate-y-0.5">
            Otra ronda
          </Link>
        )}
        <Link href="/" className="pill w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none">
          Volver al camino <ArrowRight className="size-5" />
        </Link>
      </div>
    </div>
  );
}
