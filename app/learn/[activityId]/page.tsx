import { notFound } from "next/navigation";
import { getLessonContext } from "@/lib/db";
import { buildSteps } from "@/lib/steps";
import { Player } from "@/components/player";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await params;
  const ctx = getLessonContext(activityId);
  if (!ctx) notFound();
  const steps = buildSteps(ctx.activity, ctx.speakers, ctx.refItems, ctx.checkItems);
  return (
    <Player
      activityId={ctx.activity.id}
      unitId={ctx.unit.id}
      sessionId={ctx.session.id}
      intro={(ctx.activity.data.instructions_en as string | undefined) ?? ""}
      steps={steps}
      index={ctx.index}
      total={ctx.total}
      nextId={ctx.nextId}
    />
  );
}
