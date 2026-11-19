import { notFound } from "next/navigation";
import { getLessonContext } from "@/lib/db";
import { fixesToShow, lessonCards, resumeFor, withHelp } from "@/lib/help";
import { LEARNER } from "@/lib/learner";
import { checkSteps, lessonSteps } from "@/lib/lesson-steps";
import { LessonPlayer } from "@/components/lesson-player";

export const dynamic = "force-dynamic";

// Every unit is in the lesson format (teach, then quiz) since 2026-11-18.
export default async function LessonPage({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await params;
  const ctx = getLessonContext(activityId);
  if (!ctx || ctx.unit.format !== "lessons") notFound();

  const check = ctx.activity.type === "unit_check";
  // help (teach cards, word meanings) in lessons only: the unit check measures what she can do alone
  const steps = check ? checkSteps(ctx.checkItems) : withHelp(lessonSteps(ctx.activity.id, ctx.activity.data), lessonCards(ctx.activity.data));
  if (!steps.length) notFound();
  const { sig, resume } = resumeFor(ctx.activity.id, steps);
  return (
    <LessonPlayer
      activityId={ctx.activity.id}
      unitId={ctx.unit.id}
      sessionId={ctx.session.id}
      steps={steps}
      mode={check ? "check" : "lesson"}
      nextId={ctx.nextId}
      sig={sig}
      resume={resume}
      fixes={fixesToShow(LEARNER.id)}
    />
  );
}
