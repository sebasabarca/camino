import "server-only";
import { completedSet, getUnitOutline, listUnits } from "./db";
import { LEARNER } from "./learner";

/** The pilot course with this learner's progress: per unit, per session, and where to continue. */
export function courseState() {
  const done = completedSet(LEARNER.id);
  const units = listUnits({ pilotOnly: true }).map((u) => {
    const o = getUnitOutline(u.id)!;
    const sessions = o.sessions.map((s) => {
      const finished = s.activities.filter((a) => done.has(a.id)).length;
      const next = s.activities.find((a) => !done.has(a.id)) ?? s.activities[0];
      return { ...s, finished, count: s.activities.length, complete: finished === s.activities.length, nextId: next?.id };
    });
    const count = sessions.reduce((k, s) => k + s.count, 0);
    const finished = sessions.reduce((k, s) => k + s.finished, 0);
    return { ...u, sessions, count, finished, complete: finished === count };
  });
  const current = units.find((u) => !u.complete) ?? units[units.length - 1];
  const sessionsDone = units.reduce((k, u) => k + u.sessions.filter((s) => s.complete).length, 0);
  return { units, current, sessionsDone };
}
