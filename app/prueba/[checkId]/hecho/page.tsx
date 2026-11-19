import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { courseState } from "@/lib/course";
import { Mushroom } from "@/components/mushroom";

export const dynamic = "force-dynamic";

const PASS = 0.7; // the pipeline's delayed-check pass rule ("At least 70% right")

export default async function DelayedDone({ params, searchParams }: {
  params: Promise<{ checkId: string }>;
  searchParams: Promise<{ right?: string; of?: string }>;
}) {
  const { checkId } = await params;
  const q = await searchParams;
  const c = courseState().delayed.find((d) => d.id === checkId);
  if (!c) notFound();
  const right = Number(q.right), of = Number(q.of);
  const scored = Number.isFinite(right) && Number.isFinite(of) && of > 0;
  const kept = scored && right / of >= PASS;
  return (
    <div className="flex min-h-dvh flex-col px-5 pb-32 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="flex flex-col items-center text-center">
        <Mushroom mood={kept || !scored ? "proud" : "teaching"} size={160} priority className="animate-[pop_700ms_var(--ease-out-expo)]" />
        <h1 className="mt-2 text-[32px] font-extrabold leading-10 tracking-[-0.02em] text-espresso">
          {!scored || kept ? "¡Lo recuerdas!" : "Buen repaso"}
        </h1>
        <p className="mt-2 max-w-[34ch] text-[17px] leading-[26px] text-pebble">
          {!scored || kept
            ? `${c.unitTitle}: semanas después, sigue ahí.`
            : `${c.unitTitle}: algunas cosas se olvidaron. Un repaso en Practicar las trae de vuelta.`}
        </p>
        {scored && (
          <p className={`mt-4 rounded-full px-4 py-2 font-label text-[15px] font-bold ${kept ? "bg-agave-wash text-agave-deep" : "bg-canela-wash text-canela-deep"}`}>
            <span className="tabular">{right} de {of}</span> bien
          </p>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[30rem] bg-gradient-to-t from-crema from-70% to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-8">
        <Link href="/" className="pill w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none">
          Volver al camino <ArrowRight className="size-5" />
        </Link>
      </div>
    </div>
  );
}
