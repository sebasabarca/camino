import { notFound } from "next/navigation";
import { courseState } from "@/lib/course";
import { getCheckItems } from "@/lib/db";
import { fixesToShow, resumeFor } from "@/lib/help";
import { LEARNER } from "@/lib/learner";
import { checkSteps } from "@/lib/lesson-steps";
import { LessonPlayer } from "@/components/lesson-player";

export const dynamic = "force-dynamic";

// The delayed unit check: a few weeks after the unit check, new items on the same goal. One try, no help.
export default async function DelayedCheck({ params }: { params: Promise<{ checkId: string }> }) {
  const { checkId } = await params;
  const c = courseState().delayed.find((d) => d.id === checkId);
  if (!c || !c.due) notFound();
  const steps = checkSteps(getCheckItems(checkId));
  if (!steps.length) notFound();
  const { sig, resume } = resumeFor(checkId, steps);
  return (
    <LessonPlayer
      activityId={checkId}
      steps={steps}
      mode="check"
      doneHref={`/prueba/${checkId}/hecho`}
      exitHref="/"
      sig={sig}
      resume={resume}
      fixes={fixesToShow(LEARNER.id)}
    />
  );
}
