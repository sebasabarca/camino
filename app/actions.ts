"use server";
import {
  addReport, clearLessonState, ensureLearner, markFixesSeen, pendingFixes, putLessonState, recordAttempt, reviewAfterLesson,
  reviewAfterPractice, setProgress, type SavedLesson,
} from "@/lib/db";
import { LEARNER } from "@/lib/learner";
import { requireSession } from "@/lib/session";

// One learner (Serena). The middleware guards every request, and each action checks the session again here
// (requireSession) before reading or writing progress. Add accounts before a second learner joins.
async function me() {
  await requireSession();
  ensureLearner(LEARNER.id, LEARNER.name);
  return LEARNER.id;
}

const okId = (s: unknown): s is string => typeof s === "string" && s.length > 0 && s.length <= 200;

/** `review` is set on an exercise's first try only: it schedules the spaced review. */
export async function saveAttempt(targetId: string, answer: string, correct: boolean, review?: "lesson" | "practice") {
  if (!okId(targetId) || typeof answer !== "string" || answer.length > 4000) return;
  const id = await me();
  recordAttempt(id, targetId, answer, Boolean(correct));
  if (review === "lesson") reviewAfterLesson(id, targetId, Boolean(correct));
  if (review === "practice") reviewAfterPractice(id, targetId, Boolean(correct));
}

export async function markActivity(activityId: string, status: "started" | "completed") {
  if (!okId(activityId) || !["started", "completed"].includes(status)) return;
  const id = await me();
  setProgress(id, activityId, status);
  if (status === "completed") clearLessonState(id, activityId);
}

/** Where she is inside a lesson, saved after every step so closing Safari loses nothing. */
export async function saveLessonState(activityId: string, sig: string, state: SavedLesson) {
  if (!okId(activityId) || typeof sig !== "string" || sig.length > 64) return;
  const valid = Array.isArray(state?.queue) && state.queue.length <= 400 && state.queue.every(Number.isInteger)
    && Number.isInteger(state.at) && Array.isArray(state.first) && state.first.length <= 400;
  if (!valid) return;
  putLessonState(await me(), activityId, sig, { queue: state.queue, at: state.at, first: state.first.map(([k, v]) => [String(k), Boolean(v)]) });
}

const REASONS = ["wrong_answer", "accept_mine", "not_taught", "unclear", "other"];
const cap = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.slice(0, n) : null);

/** "Algo está mal": kept for good, so the course can be corrected and she can be told. */
export async function sendReport(r: { targetId: string; activityId: string; reason: string; note?: string; answer?: string; snapshot?: string }) {
  if (!okId(r?.targetId) || !REASONS.includes(r.reason)) return false;
  addReport(await me(), {
    target_id: r.targetId, activity_id: cap(r.activityId, 200), reason: r.reason,
    note: cap(r.note, 1000), answer: cap(r.answer, 1000), snapshot: cap(r.snapshot, 8000),
  });
  return true;
}

/** She has seen these fixes; the fixed exercises come back in Practicar so she meets the corrected version. */
export async function acknowledgeFixes(ids: number[]) {
  if (!Array.isArray(ids) || ids.length > 200 || !ids.every(Number.isInteger)) return;
  const id = await me();
  const mine = pendingFixes(id).filter((p) => ids.includes(p.report.id));
  markFixesSeen(id, mine.map((p) => p.report.id));
  for (const p of mine) if (p.fix.changed && /-e\d+$/.test(p.fix.target_id)) reviewAfterLesson(id, p.fix.target_id, false);
}
