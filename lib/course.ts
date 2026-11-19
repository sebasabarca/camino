import "server-only";
import { checkSchema, delayedChecks, firstTryStats, getProgress, getSessionItems, getUnitOutline, listUnits } from "./db";
import { LEARNER } from "./learner";

const DAY = 86_400_000;
// progress timestamps are SQLite UTC ("YYYY-MM-DD HH:MM:SS")
const utc = (s: string) => Date.parse(s.replace(" ", "T") + "Z");
/** Vancouver calendar day of a timestamp, so "today" turns over at her midnight, not UTC's. */
const dayOf = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });

/** The course with this learner's progress: per unit, per lesson, where to continue, and delayed checks. */
export function courseState(now = Date.now()) {
  checkSchema();
  const prog = getProgress(LEARNER.id).filter((p) => p.status === "completed");
  const doneAt = new Map(prog.map((p) => [p.activity_id, utc(p.updated_at)]));
  // every unit is in the lesson format since 2026-11-18; older exports may still hold dialogue units
  const units = listUnits().filter((u) => u.format === "lessons").map((u) => {
    const o = getUnitOutline(u.id)!;
    const sessions = o.sessions.map((s) => {
      const finished = s.activities.filter((a) => doneAt.has(a.id)).length;
      const next = s.activities.find((a) => !doneAt.has(a.id)) ?? s.activities[0];
      return { ...s, finished, count: s.activities.length, complete: finished === s.activities.length, nextId: next?.id };
    });
    const count = sessions.reduce((k, s) => k + s.count, 0);
    const finished = sessions.reduce((k, s) => k + s.finished, 0);
    return { ...u, sessions, count, finished, complete: finished === count };
  });
  const current = units.find((u) => !u.complete) ?? units[units.length - 1];
  const sessionsDone = units.reduce((k, u) => k + u.sessions.filter((s) => s.complete).length, 0);

  // a delayed check opens `release_after_days` after she finished the unit check
  const delayed = delayedChecks().flatMap((c) => {
    const unit = units.find((u) => u.id === c.unit_id);
    const checked = doneAt.get(`${c.unit_id}-check-a`);
    if (!unit || checked == null) return [];
    const dueAt = checked + (c.release_after_days ?? 24) * DAY;
    return [{ ...c, unitTitle: unit.title, dueAt, due: dueAt <= now, done: doneAt.has(c.id) }];
  });

  const today = dayOf(now);
  const lessonsToday = prog.filter((p) => /-l\d+-a$/.test(p.activity_id) && dayOf(utc(p.updated_at)) === today).length;
  return { units, current, sessionsDone, delayed, lessonsToday };
}

/** Phrases she has actually met: the words practised in lessons she has finished, grouped under the unit
 *  where she first met them. */
export function learnedPhrases() {
  const { units } = courseState();
  const seen = new Set<string>();
  return units
    .map((u) => ({
      unit: u,
      items: u.sessions
        .filter((s) => s.complete)
        .flatMap((s) => getSessionItems(s.id))
        .filter((i) => !seen.has(i.id) && seen.add(i.id)),
    }))
    .filter((g) => g.items.length > 0);
}

/** Plain facts for the Yo tab: no streaks, nothing that can be lost. */
export function learnerStats() {
  const { units, delayed, lessonsToday } = courseState();
  const isCheck = (title: string) => title === "Prueba de la unidad";
  const lessons = units.reduce((k, u) => k + u.sessions.filter((s) => s.complete && !isCheck(s.title)).length, 0);
  const passed = units.filter((u) => u.sessions.some((s) => isCheck(s.title) && s.complete)).length;
  const phrases = learnedPhrases().reduce((k, g) => k + g.items.length, 0);
  const ft = firstTryStats(LEARNER.id);
  return {
    lessons,
    passed,
    totalUnits: units.length,
    phrases,
    firstTry: ft.n >= 10 ? Math.round((100 * ft.right) / ft.n) : null, // too few answers say nothing
    remembered: delayed.filter((d) => d.done).length,
    lessonsToday,
  };
}
