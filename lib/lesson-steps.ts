// Lesson format (pipeline schema unit.v2, "teach, then quiz"): teach cards, then Duolingo-style exercises.
// Pure and server-side like steps.ts. Tile banks and choice orders are shuffled here with a seed from the id,
// so the server and client render the same order and a retry shows the same screen.

export type Example = { es: string; en?: string };
export type Card =
  | { kind: "word" | "phrase"; es: string; en: string; note?: string; example?: Example }
  | { kind: "rule"; title: string; body: string; pattern?: string; examples: Example[] }
  | { kind: "conjugation"; verb: string; meaning: string; forms: { person: string; es: string; en: string }[]; note?: string }
  | { kind: "tip"; body: string; examples: Example[] };

/** `cards` (the teach cards behind an exercise) and `gloss` (tap-a-word meanings for its Spanish sentence) are help
 *  added on the server by lib/help.ts, in lessons and practice only, never in a unit check. */
type Common = { id: string; hint?: string; tip?: string; items?: string[]; cards?: Card[]; gloss?: Record<string, string> };
export type LessonStep =
  | ({ kind: "teach"; card: Card; pos: number; count: number } & Pick<Common, "id">)
  | ({ kind: "pick"; ask: "meaning" | "spanish" | "gap"; prompt: string; sentence?: string; en?: string; choices: string[]; answer: string } & Common)
  | ({ kind: "match"; pairs: { es: string; en: string }[]; right: string[] } & Common)
  | ({ kind: "tiles"; prompt: string; answer: string; keys: string[]; bank: string[] } & Common)
  | ({ kind: "fill"; ask: "gap" | "conjugate" | "translate"; prompt: string; label?: string; sentence?: string; answer: string; keys: string[] } & Common);

type Obj = Record<string, unknown>;
const arr = <T = Obj>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
const strs = (v: unknown) => arr<unknown>(v).filter((x): x is string => typeof x === "string");
const examples = (v: unknown): Example[] => arr(v).filter((e) => str(e.es)).map((e) => ({ es: str(e.es)!, en: str(e.en) }));

/** Deterministic shuffle (mulberry32 seeded by the id). Never leaves the answer order unchanged when it can move. */
export function shuffle<T>(xs: T[], seed: string): T[] {
  let h = 1779033703;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353);
  const rnd = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.length > 1 && out.every((x, i) => x === xs[i])) out.push(out.shift()!);
  return out;
}

export function card(c: Obj): Card | null {
  const ex = c.example as Obj | undefined;
  switch (c.kind) {
    case "word":
    case "phrase":
      return str(c.es) ? { kind: c.kind, es: str(c.es)!, en: str(c.en) ?? "", note: str(c.note), example: ex && str(ex.es) ? { es: str(ex.es)!, en: str(ex.en) } : undefined } : null;
    case "rule":
      return { kind: "rule", title: str(c.title) ?? "", body: str(c.body) ?? "", pattern: str(c.pattern), examples: examples(c.examples) };
    case "conjugation":
      return {
        kind: "conjugation", verb: str(c.verb) ?? "", meaning: str(c.meaning) ?? "", note: str(c.note),
        forms: arr(c.forms).map((f) => ({ person: str(f.person) ?? "", es: str(f.es) ?? "", en: str(f.en) ?? "" })),
      };
    case "tip":
      return str(c.body) ? { kind: "tip", body: str(c.body)!, examples: examples(c.examples) } : null;
  }
  return null;
}

export function exercise(e: Obj, id = str(e.id) ?? "ex"): LessonStep | null {
  const common = { id, hint: str(e.hint), tip: str(e.tip), items: strs(e.items) };
  const keys = (a: string) => [a, ...strs(e.accepted_answers)];
  const answer = str(e.answer);
  switch (e.type) {
    case "choose_meaning":
    case "choose_spanish":
    case "fill_choice": {
      const choices = strs(e.choices);
      if (!answer || !choices.includes(answer)) return null;
      const ask = e.type === "choose_meaning" ? "meaning" : e.type === "choose_spanish" ? "spanish" : "gap";
      return {
        kind: "pick", ask, ...common, answer, choices: shuffle(choices, id),
        prompt: (ask === "meaning" ? str(e.prompt_es) : ask === "spanish" ? str(e.prompt_en) : str(e.en)) ?? "",
        sentence: ask === "gap" ? str(e.sentence_es) : undefined,
      };
    }
    case "match": {
      const pairs = arr(e.pairs).filter((p) => str(p.es) && str(p.en)).map((p) => ({ es: str(p.es)!, en: str(p.en)! }));
      return pairs.length >= 2 ? { kind: "match", ...common, pairs: shuffle(pairs, id + "l"), right: shuffle(pairs.map((p) => p.en), id + "r") } : null;
    }
    case "tiles": {
      if (!answer) return null;
      // tiles show bare words; answer checking ignores punctuation anyway (lib/answer.ts)
      const bare = (w: string) => w.replace(/[¿?¡!.,;:"“”]/g, "");
      const bank = [...answer.split(/\s+/), ...strs(e.distractors)].map(bare).filter(Boolean);
      return { kind: "tiles", ...common, prompt: str(e.prompt_en) ?? "", answer, keys: keys(answer), bank: shuffle(bank, id) };
    }
    case "fill_type":
      return answer ? { kind: "fill", ask: "gap", ...common, prompt: str(e.en) ?? "", sentence: str(e.sentence_es), answer, keys: keys(answer) } : null;
    case "conjugate":
      return answer
        ? { kind: "fill", ask: "conjugate", ...common, prompt: str(e.en) ?? "", label: [str(e.verb), str(e.person)].filter(Boolean).join(" · "), sentence: str(e.sentence_es), answer, keys: keys(answer) }
        : null;
    case "type_spanish":
      return answer ? { kind: "fill", ask: "translate", ...common, prompt: str(e.prompt_en) ?? "", answer, keys: keys(answer) } : null;
  }
  return null;
}

/** A lesson activity → teach cards (in order), then its exercises. */
export function lessonSteps(activityId: string, data: Obj): LessonStep[] {
  const cards = arr(data.teach).map((c) => ({ id: str(c.id) ?? activityId, c: card(c) })).filter((x) => x.c);
  const teach: LessonStep[] = cards.map((x, i) => ({ kind: "teach", id: x.id, card: x.c!, pos: i + 1, count: cards.length }));
  const quiz = arr(data.exercises).map((e) => exercise(e)).filter((s): s is LessonStep => !!s);
  return [...teach, ...quiz];
}

/** Unit-check items share the exercise shapes. */
export function checkSteps(items: { id: string; data: Obj }[]): LessonStep[] {
  return items.map((c) => exercise(c.data, c.id)).filter((s): s is LessonStep => !!s);
}
