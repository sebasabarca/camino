import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSession, getSessionItems } from "@/lib/db";
import { courseState } from "@/lib/course";
import { Mushroom } from "@/components/mushroom";
import { SayIt } from "@/components/say-it";

export const dynamic = "force-dynamic";

export default async function SessionDone({ params, searchParams }: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ right?: string; of?: string; check?: string }>;
}) {
  const { sessionId } = await params;
  const q = await searchParams;
  const session = getSession(sessionId);
  if (!session) notFound();
  const { units } = courseState();
  const unit = units.find((u) => u.id === session.unit_id)!;
  const next = unit.sessions.find((s) => !s.complete);
  const items = getSessionItems(sessionId).slice(0, 8);
  const lessons = unit.format === "lessons";
  const right = Number(q.right), of = Number(q.of);
  const scored = Number.isFinite(right) && Number.isFinite(of) && of > 0;
  const title = !lessons ? "¡Sesión terminada!" : q.check ? "¡Prueba terminada!" : "¡Lección terminada!";

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-32 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="flex flex-col items-center text-center">
        <Mushroom mood="proud" size={160} priority className="animate-[pop_700ms_var(--ease-out-expo)]" />
        <h1 className="mt-2 text-[32px] font-extrabold leading-10 tracking-[-0.02em] text-espresso">{title}</h1>
        <p className="mt-2 max-w-[34ch] text-[17px] leading-[26px] text-pebble">{session.objective}</p>
        {scored && (
          <p className="mt-4 rounded-full bg-agave-wash px-4 py-2 font-label text-[15px] font-bold text-agave-deep">
            <span className="tabular">{right} de {of}</span> a la primera
          </p>
        )}
      </div>

      {items.length > 0 && (
        <section aria-labelledby="today" className="mt-8">
          <h2 id="today" className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-espresso">{lessons ? "Lo que aprendiste" : "Lo que practicaste hoy"}</h2>
          <ul className="card mt-3 divide-y divide-[rgba(74,52,42,0.08)] px-5">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-semibold leading-6 text-espresso">{i.spanish}</p>
                  {i.gloss && <p className="text-[14px] leading-5 text-pebble">{i.gloss}</p>}
                </div>
                <SayIt text={i.spanish} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[30rem] bg-gradient-to-t from-crema from-70% to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-8">
        <Link
          href={next && next.id !== session.id ? `/unit/${unit.id}` : "/"}
          className="pill w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none"
        >
          Volver al camino <ArrowRight className="size-5" />
        </Link>
      </div>
    </div>
  );
}
