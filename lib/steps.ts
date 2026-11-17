// Turns one activity (any of the pipeline's activity types) into a short run of screens ("steps").
// Pure and server-side: the client receives only the steps, not the raw payload.

export type Line = { text: string; who: string; name?: string; en?: string };
export type Feedback = { correct?: string; incorrect?: string };

export type Step =
  | { kind: "listen"; id: string; lines?: Line[]; text?: string; reveal: "always" | "after"; prompt?: string }
  | { kind: "learn"; id: string; note?: string; noticing?: string; examples: { es: string; en?: string }[] }
  | { kind: "choice"; id: string; q: string; qEs: boolean; choices: string[]; answer: string; feedback: Feedback; hear?: Line[] }
  | { kind: "type"; id: string; cue: string; answer: string; keys: string[]; feedback: Feedback }
  | { kind: "say"; id: string; hear?: Line[]; cue?: string; target?: string; keys: string[]; frame?: string; selfCheck: string[]; feedback: Feedback }
  | { kind: "write"; id: string; prompt: string; incoming?: string; model?: string; checklist: string[] }
  | { kind: "rate"; id: string; prompt: string; options: { id: string; es: string; en: string }[] };

type Obj = Record<string, unknown>;
const arr = <T = Obj>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const strs = (v: unknown) => arr<unknown>(v).filter((x): x is string => typeof x === "string");

function lines(d: Obj, speakers: Record<string, string>): Line[] | undefined {
  const raw = [...arr(d.dialogue), ...arr(d.tutor_lines), ...arr(d.server_lines)];
  const out = raw
    .filter((l) => str(l.es))
    .map((l) => ({ text: str(l.es)!, who: str(l.speaker) ?? "mushroom", name: speakers[str(l.speaker) ?? ""], en: str(l.en) }));
  return out.length ? out : undefined;
}

function questions(d: Obj, hear?: Line[]): Step[] {
  return arr(d.questions)
    .filter((q) => strs(q.choices).length && str(q.answer))
    .map((q) => ({
      kind: "choice" as const,
      id: str(q.id)!,
      q: str(q.q) ?? "",
      qEs: q.lang === "es",
      choices: strs(q.choices),
      answer: str(q.answer)!,
      feedback: (q.feedback as Feedback) ?? {},
      hear,
    }));
}

function cues(d: Obj, spoken: boolean): Step[] {
  return [...arr(d.cues), ...arr(d.practice), ...arr(d.recall_cues)]
    .filter((c) => str(c.answer))
    .map((c): Step =>
      spoken
        ? { kind: "say", id: str(c.id)!, cue: str(c.cue_en), target: str(c.answer), keys: strs(c.accepted_answers), selfCheck: [], feedback: (c.feedback as Feedback) ?? {} }
        : { kind: "type", id: str(c.id)!, cue: str(c.cue_en) ?? "", answer: str(c.answer)!, keys: [str(c.answer)!, ...strs(c.accepted_answers)], feedback: (c.feedback as Feedback) ?? {} },
    );
}

function prompts(d: Obj, speakers: Record<string, string>): Step[] {
  const who = str(d.speaker) ?? "partner";
  return [...arr(d.prompt_bank), ...arr(d.prompts)].map((p): Step => {
    const hear = [str(p.tutor_es), str(p.server_es)].filter(Boolean).map((t) => ({ text: t!, who, name: speakers[who] }));
    return {
      kind: "say",
      id: str(p.id)!,
      hear: hear.length ? hear : undefined,
      cue: str(p.situation_en) ?? str(p.prompt_en),
      target: str(p.target_es) ?? str(p.expected_response),
      keys: [...strs(p.accepted), ...strs(p.accepted_answers), ...strs(p.accepted_responses)],
      selfCheck: [],
      feedback: (p.feedback as Feedback) ?? {},
    };
  });
}

/** One activity or check item → steps. `id` scopes ids so check items never collide with practice ids. */
function fromData(id: string, type: string, response: string, d: Obj, speakers: Record<string, string>, refItems: { id: string; spanish: string; gloss: string }[]): Step[] {
  const steps: Step[] = [];
  const ls = lines(d, speakers);
  const text = str(d.text_es) ?? str(d.screen_text_es) ?? str(d.source_message_es);
  const spoken = response === "spoken";

  if (type === "explanation") {
    steps.push({ kind: "learn", id: `${id}-learn`, note: str(d.note_en), noticing: str(d.noticing_en), examples: arr(d.examples).map((e) => ({ es: str(e.es) ?? "", en: str(e.en) })) });
    steps.push(...cues(d, false), ...questions(d));
    return steps;
  }
  if (type === "feedback") {
    const options = refItems.slice(0, 6).map((i) => ({ id: i.id, es: i.spanish, en: i.gloss }));
    return [{ kind: "rate", id, prompt: str(d.prompt_en) ?? "Which phrase should come back tomorrow?", options }];
  }
  if (type === "writing" || response === "written") {
    const incoming = d.incoming_text as Obj | string | undefined;
    return [{
      kind: "write", id,
      prompt: str(d.prompt_en) ?? str(d.task_en) ?? "",
      incoming: typeof incoming === "string" ? incoming : str(incoming?.es) ?? text,
      model: str(d.model_answer),
      checklist: [...strs(d.checklist), ...strs(d.required_language)],
    }];
  }
  if (type === "guided_speaking") {
    if (ls) steps.push({ kind: "listen", id: `${id}-model`, lines: ls, reveal: "always" });
    // she answers the tutor's first question; the model lines were the previous screen
    const first = ls?.filter((l) => l.text.trim().endsWith("?")).slice(0, 1);
    steps.push({
      kind: "say", id, hear: first?.length ? first : undefined,
      cue: str(d.on_screen_en) ?? str(d.prompt_en) ?? "Ahora tú. Contesta como en el modelo.",
      frame: str(d.frame) ?? str(d.on_screen_es),
      target: str(d.expected_response),
      keys: strs(d.accepted_responses),
      selfCheck: strs(d.self_check),
      feedback: {},
    });
    return steps;
  }

  // listening, reading, review, fluency, unpredictable prompts, and check items share these parts
  if (ls && !arr(d.prompt_bank).length && !arr(d.prompts).length && !arr(d.cues).length)
    steps.push({ kind: "listen", id: `${id}-listen`, lines: ls, reveal: d.show_transcript === "after_first_listen" ? "after" : "always" });
  if (text && type !== "writing") steps.push({ kind: "listen", id: `${id}-read`, text, reveal: "always" });
  steps.push(...questions(d, ls), ...cues(d, spoken), ...prompts(d, speakers));
  if (spoken && str(d.expected_response) && !steps.some((s) => s.kind === "say"))
    steps.push({ kind: "say", id, cue: str(d.prompt_en) ?? str(d.task_en), target: str(d.expected_response), keys: [...strs(d.accepted_responses), ...strs(d.expected_responses)], selfCheck: strs(d.self_check), feedback: {} });
  return steps;
}

export function buildSteps(
  activity: { id: string; type: string; response_type: string; data: Obj },
  speakers: Record<string, string>,
  refItems: { id: string; spanish: string; gloss: string }[],
  checkItems: { id: string; skill: string; data: Obj }[],
): Step[] {
  if (activity.type === "unit_check")
    return checkItems.flatMap((c) =>
      fromData(c.id, c.skill, c.skill === "speaking" ? "spoken" : c.skill === "writing" ? "written" : "choice", c.data, speakers, refItems),
    );
  const steps = fromData(activity.id, activity.type, activity.response_type, activity.data, speakers, refItems);
  return steps.length ? steps : [{ kind: "learn", id: `${activity.id}-note`, note: str(activity.data.task_en) ?? str(activity.data.instructions_en), examples: [] }];
}
