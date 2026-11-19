// The owner's progress page (/admin). Server only; read-only except for a report's status.
import "server-only";
import { courseState } from "./course";
import { allFixes, allLessons, listBackups, listReports, progressAttempts } from "./db";
import { LEARNER } from "./learner";

const utc = (s: string) => Date.parse(s.replace(" ", "T") + "Z");
const dayOf = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
type Obj = Record<string, unknown>;

/** A short label for an exercise or card id: its prompt or sentence. */
function labels() {
  const m = new Map<string, string>();
  for (const l of allLessons()) {
    for (const c of (l.data.teach as Obj[] | undefined) ?? []) m.set(String(c.id), String(c.es ?? c.title ?? c.verb ?? c.body ?? ""));
    for (const e of (l.data.exercises as Obj[] | undefined) ?? [])
      m.set(String(e.id), String(e.sentence_es ?? e.prompt_es ?? e.prompt_en ?? e.en ?? e.verb ?? e.answer ?? ""));
  }
  return m;
}

export function adminData(now = Date.now()) {
  const attempts = progressAttempts(LEARNER.id);
  const { units, delayed } = courseState(now);
  const label = labels();

  // first try per target: what she knew before any hint
  const firstTry = new Map<string, boolean>();
  for (const a of attempts) if (!firstTry.has(a.target_id)) firstTry.set(a.target_id, !!a.correct);
  const rate = (pred: (id: string) => boolean) => {
    const xs = [...firstTry].filter(([id]) => pred(id));
    return xs.length ? { right: xs.filter(([, ok]) => ok).length, of: xs.length } : null;
  };

  const today = dayOf(now);
  const days = Array.from({ length: 14 }, (_, i) => dayOf(now - (13 - i) * 86_400_000));
  const perDay = new Map<string, number>();
  for (const a of attempts) {
    const d = dayOf(utc(a.created_at));
    perDay.set(d, (perDay.get(d) ?? 0) + 1);
  }

  const perUnit = units.map((u) => {
    const lessons = u.sessions.filter((s) => s.title !== "Prueba de la unidad");
    const memory = delayed.find((d) => d.unit_id === u.id);
    return {
      id: u.id, title: u.title,
      done: lessons.filter((s) => s.complete).length, total: lessons.length,
      lessons: rate((id) => id.startsWith(`${u.id}-l`)),
      check: rate((id) => id.startsWith(`${u.id}-check-a-`)),
      delayed: rate((id) => id.startsWith(`${u.id}-check-d-`)),
      delayedDue: memory ? (memory.done ? "hecho" : memory.due ? "pendiente" : dayOf(memory.dueAt)) : null,
    };
  });

  // most-missed exercises, with her wrong answers
  const wrong = new Map<string, string[]>();
  for (const a of attempts) if (!a.correct) wrong.set(a.target_id, [...(wrong.get(a.target_id) ?? []), a.answer ?? ""]);
  const hardest = [...wrong].sort((a, b) => b[1].length - a[1].length).slice(0, 12)
    .map(([id, answers]) => ({ id, label: label.get(id) ?? "", misses: answers.length, answers: [...new Set(answers)].slice(-3) }));

  const fixes = allFixes();
  const reports = listReports(LEARNER.id).map((r) => ({
    ...r,
    label: label.get(r.target_id) ?? "",
    state: r.status === "dismissed" ? "descartado" : fixes.has(r.id) ? (r.fix_seen_at ? "arreglado y visto" : "arreglado") : "abierto",
    fix: fixes.get(r.id)?.note ?? null,
  }));

  const last = attempts.length ? attempts[attempts.length - 1].created_at : null;
  return {
    lastActive: last ? new Date(utc(last)).toLocaleString("es-MX", { timeZone: "America/Vancouver", dateStyle: "medium", timeStyle: "short" }) : null,
    studiedToday: perDay.has(today),
    days: days.map((d) => ({ day: d, answers: perDay.get(d) ?? 0 })),
    overall: rate(() => true),
    perUnit,
    hardest,
    reports,
    backups: listBackups().slice(0, 5),
  };
}
