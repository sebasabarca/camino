"use server";
import { ensureLearner, recordAttempt, setProgress } from "@/lib/db";
import { LEARNER } from "@/lib/learner";

// shortcut: the pilot has one learner and no login; add accounts before a second learner joins.
function me() {
  ensureLearner(LEARNER.id, LEARNER.name);
  return LEARNER.id;
}

export async function saveAttempt(targetId: string, answer: string, correct: boolean) {
  if (typeof targetId !== "string" || targetId.length > 200 || typeof answer !== "string" || answer.length > 4000) return;
  recordAttempt(me(), targetId, answer, Boolean(correct));
}

export async function markActivity(activityId: string, status: "started" | "completed") {
  if (typeof activityId !== "string" || activityId.length > 200 || !["started", "completed"].includes(status)) return;
  setProgress(me(), activityId, status);
}
