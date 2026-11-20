import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, LogOut } from "lucide-react";
import { adminData } from "@/lib/admin";
import { isOwner } from "@/lib/session";
import { logout } from "@/app/login/actions";
import { setReport } from "./actions";

export const dynamic = "force-dynamic";

const REASON: Record<string, string> = {
  wrong_answer: "La respuesta correcta está mal",
  accept_mine: "Su respuesta debería valer",
  not_taught: "No se lo enseñaron",
  unclear: "No se entiende",
  other: "Otra cosa",
};
const pct = (r: { right: number; of: number } | null) => (r ? `${Math.round((100 * r.right) / r.of)} %` : "—");
const pctTitle = (r: { right: number; of: number } | null) => (r ? `${r.right} de ${r.of} a la primera` : "sin datos");

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-[20px] font-bold leading-7 tracking-[-0.01em] text-espresso">{children}</h2>;
}

// The owner's view of Serena's progress. Login as owner (OWNER_PASSWORD) to see it.
export default async function Admin() {
  if (!(await isOwner())) notFound();
  const d = adminData();
  const max = Math.max(1, ...d.days.map((x) => x.answers));
  const open = d.reports.filter((r) => r.state === "abierto").length;

  return (
    <div className="px-5 pb-28 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">Progreso de Serena</h1>
        <form action={logout}>
          <button type="submit" aria-label="Cerrar sesión" className="grid size-12 place-items-center rounded-full text-pebble hover:bg-crema-mid">
            <LogOut className="size-5" aria-hidden />
          </button>
        </form>
      </div>
      <p className="mt-1 text-[15px] leading-[22px] text-pebble">
        {d.lastActive ? `Última actividad: ${d.lastActive}` : "Aún no ha respondido nada."} · A la primera en total:{" "}
        <span className="font-semibold text-espresso" title={pctTitle(d.overall)}>{pct(d.overall)}</span>
      </p>
      <p className="mt-2 rounded-[1rem] bg-canela-wash px-3 py-2 text-[14px] leading-5 text-canela-deep">
        Con esta sesión, lo que hagas en las lecciones cuenta como si fuera Serena.
      </p>

      <section aria-labelledby="dias" className="mt-7">
        <H2 id="dias">Últimos 14 días</H2>
        <p className="text-[14px] leading-5 text-pebble">Respuestas por día (hora de Vancouver).</p>
        <div className="card mt-3 flex h-36 items-end gap-1.5 px-4 pb-3 pt-4">
          {d.days.map((x) => (
            <div key={x.day} className="flex flex-1 flex-col items-center gap-1" title={`${x.day}: ${x.answers}`}>
              <span className="font-label tabular text-[10px] text-pebble">{x.answers || ""}</span>
              <div className={`w-full rounded-t-[4px] ${x.answers ? "bg-terra" : "bg-sand"}`} style={{ height: `${Math.max(4, (x.answers / max) * 80)}px` }} />
              <span className="font-label text-[10px] text-pebble">{x.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="unidades" className="mt-8">
        <H2 id="unidades">Por unidad</H2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-[14px]">
            <thead className="font-label text-[12px] text-pebble">
              <tr><th className="px-3 py-2">Unidad</th><th className="px-2">Lecciones</th><th className="px-2">A la primera</th><th className="px-2">Prueba</th><th className="px-2">Memoria</th></tr>
            </thead>
            <tbody className="divide-y divide-[rgba(74,52,42,0.08)]">
              {d.perUnit.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2.5 font-semibold text-espresso">{u.title}</td>
                  <td className="px-2 tabular">{u.done}/{u.total}</td>
                  <td className="px-2 tabular" title={pctTitle(u.lessons)}>{pct(u.lessons)}</td>
                  <td className="px-2 tabular" title={pctTitle(u.check)}>{pct(u.check)}</td>
                  <td className="px-2 tabular" title={u.delayedDue ?? ""}>{u.delayed ? pct(u.delayed) : u.delayedDue ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="avisos" className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <H2 id="avisos">Avisos de Serena {open ? `(${open} abiertos)` : ""}</H2>
          <a href="/admin/reports.json" className="flex min-h-11 items-center gap-1.5 rounded-full px-3 font-label text-[14px] font-bold text-terra-deep hover:bg-terra-wash">
            <Download className="size-4" aria-hidden /> JSON
          </a>
        </div>
        <p className="text-[14px] leading-5 text-pebble">
          Arreglar: <code>python3 tools/sgo.py fix-reports</code>, luego finalize, export y reiniciar. Ella ve la nota en su próxima lección.
        </p>
        {d.reports.length === 0 ? (
          <p className="mt-3 text-[15px] text-pebble">Sin avisos.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {d.reports.map((r) => (
              <li key={r.id} className="card px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-label text-[12px] font-semibold text-pebble">#{r.id} · {r.target_id} · {r.created_at.slice(0, 10)}</p>
                  <span className={`rounded-full px-2 py-0.5 font-label text-[12px] font-bold ${r.state === "abierto" ? "bg-canela-wash text-canela-deep" : r.state === "descartado" ? "bg-sand text-pebble" : "bg-agave-wash text-agave-deep"}`}>{r.state}</span>
                </div>
                <p className="mt-1 text-[16px] font-semibold leading-6 text-espresso">{REASON[r.reason] ?? r.reason}</p>
                {r.label && <p className="text-[14px] leading-5 text-pebble">Ejercicio: {r.label}</p>}
                {r.answer && <p className="text-[14px] leading-5 text-pebble">Su respuesta: «{r.answer}»</p>}
                {r.note && <p className="mt-1 text-[15px] leading-[22px] text-espresso">“{r.note}”</p>}
                {r.fix && <p className="mt-1 text-[14px] leading-5 text-agave-deep">Arreglo: {r.fix}</p>}
                {(r.state === "abierto" || r.state === "descartado") && (
                  <form action={setReport.bind(null, r.id, r.state === "abierto" ? "dismissed" : "open")} className="mt-2">
                    <button type="submit" className="min-h-10 rounded-full px-3 font-label text-[13px] font-bold text-pebble hover:bg-crema-mid">
                      {r.state === "abierto" ? "Descartar (no hace falta cambiar)" : "Reabrir"}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="dificil" className="mt-8">
        <H2 id="dificil">Lo que más falla</H2>
        {d.hardest.length === 0 ? (
          <p className="mt-2 text-[15px] text-pebble">Nada todavía.</p>
        ) : (
          <ul className="card mt-3 divide-y divide-[rgba(74,52,42,0.08)] px-4">
            {d.hardest.map((h) => (
              <li key={h.id} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 text-[15px] font-semibold leading-6 text-espresso">{h.label || h.id}</p>
                  <span className="shrink-0 font-label tabular text-[13px] font-bold text-terra-deep">{h.misses}×</span>
                </div>
                <p className="font-label text-[12px] text-pebble">{h.id}</p>
                {h.answers.some(Boolean) && <p className="text-[14px] leading-5 text-pebble">Escribió: {h.answers.filter(Boolean).map((a) => `«${a}»`).join(", ")}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="copias" className="mt-8">
        <H2 id="copias">Copias de seguridad</H2>
        <p className="text-[14px] leading-5 text-pebble">Una al día en data/backups (se guardan 30). Cópialas fuera del servidor de vez en cuando.</p>
        <ul className="mt-2 text-[14px] leading-6 text-espresso">
          {d.backups.length ? d.backups.map((b) => <li key={b.name} className="tabular">{b.name} · {Math.round(b.bytes / 1024)} KB</li>) : <li className="text-pebble">Ninguna todavía.</li>}
        </ul>
      </section>

      <p className="mt-8"><Link href="/" className="font-label text-[14px] font-bold text-terra-deep">Ir al camino</Link></p>
    </div>
  );
}
