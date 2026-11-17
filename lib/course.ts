import "server-only";
import { completedSet, getSessionItems, getUnitOutline, listUnits } from "./db";
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

/** Phrases she has actually met: the words practised in sessions she has finished, grouped under the unit
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
  const { units, sessionsDone } = courseState();
  const minutes = units.reduce((k, u) => k + u.sessions.reduce((m, s) => m + (s.complete ? s.minutes : 0), 0), 0);
  const goals = units.filter((u) => u.complete).length;
  const phrases = learnedPhrases().reduce((k, g) => k + g.items.length, 0);
  return { sessionsDone, minutes, goals, totalGoals: units.length, phrases };
}
