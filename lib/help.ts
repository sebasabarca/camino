// Help during a quiz, and the spaced-review set. Server only.
// - "Ver tarjeta": the teach cards behind an exercise, found by the item ids the exercise practises.
// - Tap a word: meanings for single Spanish words in a gap sentence, from word cards and conjugation tables.
// - Practicar: exercises from finished lessons that are due again (missed ones first), one per item.
import "server-only";
import { createHash } from "node:crypto";
import { allItems, allLessons, completedLessons, getLessonState, getReviews, INTERVALS, pendingFixes } from "./db";
import { LEARNER } from "./learner";
import { card, exercise, type Card, type LessonStep } from "./lesson-steps";

type Obj = Record<string, unknown>;
const arr = (v: unknown) => (Array.isArray(v) ? (v as Obj[]) : []);

/** Same folding as answer checking: lower case, no accents, ñ kept. */
export const foldWord = (w: string) =>
  w.toLowerCase().replace(/ñ/g, "\u0000").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0000/g, "ñ");
const WORD = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;

type Index = { byItem: Map<string, Card[]>; gloss: Map<string, string>; byLesson: Map<string, Card[]> };
const g = globalThis as unknown as { helpIndex?: Index };

function index(): Index {
  if (g.helpIndex) return g.helpIndex;
  const byItem = new Map<string, Card[]>();
  const byLesson = new Map<string, Card[]>();
  const gloss = new Map<string, string>();
  const text: { c: Card; blob: string }[] = [];
  const addGloss = (es: string, en: string) => {
    const words = es.replace(/\.\.\.|…/g, " ").match(WORD) ?? [];
    if (words.length === 1 && en && !gloss.has(foldWord(words[0]))) gloss.set(foldWord(words[0]), en);
  };
  for (const l of allLessons()) {
    for (const raw of arr(l.data.teach)) {
      const c = card(raw);
      if (!c) continue;
      byLesson.set(l.id, [...(byLesson.get(l.id) ?? []), c]);
      text.push({ c, blob: ` ${cardText(c)} ` });
      // first card that teaches an item is the one she saw first
      for (const it of (raw.items as string[] | undefined) ?? []) if (!byItem.has(it)) byItem.set(it, [c]);
      if (c.kind === "word" || c.kind === "phrase") {
        const es = c.es.split(/\s*\/\s*/), en = c.en.split(/\s*\/\s*/);
        es.forEach((v, i) => addGloss(v, es.length === en.length ? en[i] : c.en));
      }
      if (c.kind === "conjugation") for (const f of c.forms) addGloss(f.es, f.en);
    }
  }
  // most cards don't list item ids: find an item's card by its Spanish (first card, in course order, that shows it)
  for (const it of allItems()) {
    if (byItem.has(it.id) || !it.spanish) continue;
    const variants = it.spanish.split(/\s*\/\s*/).map((v) => plain(v)).filter((v) => v.length >= 2);
    const hit = text.find((t) => variants.some((v) => t.blob.includes(` ${v} `)));
    if (hit) byItem.set(it.id, [hit.c]);
  }
  g.helpIndex = { byItem, gloss, byLesson };
  return g.helpIndex;
}

/** Folded words joined by single spaces, for whole-word text matching. */
const plain = (s: string) => (s.match(WORD) ?? []).map(foldWord).join(" ");

function cardText(c: Card): string {
  switch (c.kind) {
    case "word":
    case "phrase":
      return plain([c.es, c.example?.es].join(" "));
    case "rule":
      return plain([c.pattern, ...c.examples.map((e) => e.es)].join(" "));
    case "conjugation":
      return plain(c.forms.map((f) => f.es).join(" "));
    case "tip":
      return plain(c.examples.map((e) => e.es).join(" "));
  }
}

/** Lesson id of an exercise id ("a1-u01-l03-e05" → "a1-u01-l03-a"). */
const lessonOf = (exerciseId: string) => exerciseId.replace(/-e\d+$/, "-a");

/** Adds teach cards and word meanings to quiz steps. Cards come from the items an exercise practises, else from
 *  `own` (this lesson's cards), else from the lesson the exercise belongs to (practice). */
export function withHelp(steps: LessonStep[], own: Card[] = []): LessonStep[] {
  const { byItem, gloss, byLesson } = index();
  return steps.map((s) => {
    if (s.kind === "teach") return s;
    const seen = new Set<Card>();
    const fromItems = (s.items ?? []).flatMap((it) => byItem.get(it) ?? []).filter((c) => !seen.has(c) && seen.add(c)).slice(0, 3);
    const cards = fromItems.length ? fromItems : own.length ? own : (byLesson.get(lessonOf(s.id)) ?? []);
    const sentence = "sentence" in s ? s.sentence : undefined;
    let words: Record<string, string> | undefined;
    if (sentence) {
      const hidden = new Set((("answer" in s ? s.answer : "").match(WORD) ?? []).map(foldWord));
      for (const w of sentence.match(WORD) ?? []) {
        const k = foldWord(w), en = gloss.get(k);
        if (en && !hidden.has(k)) (words ??= {})[k] = en;
      }
    }
    return { ...s, cards: cards.length ? cards : undefined, gloss: words };
  });
}

export function lessonCards(data: Obj): Card[] {
  return arr(data.teach).map((c) => card(c)).filter((c): c is Card => !!c);
}

const DAY = 86_400_000;
export const PRACTICE_SIZE = 12;

/** What is due for review now. Never-missed exercises from a finished lesson come due one day after it. */
export function practiceSet(learnerId: string, now = Date.now()) {
  const reviews = getReviews(learnerId);
  type Cand = { e: Obj; id: string; box: number; due: number; misses: number; item: string };
  const due: Cand[] = [];
  for (const l of completedLessons(learnerId)) {
    for (const e of arr(l.data.exercises)) {
      const id = String(e.id ?? "");
      if (!id) continue;
      const r = reviews.get(id);
      const box = r?.box ?? 1;
      const at = r ? Date.parse(r.due_at) : l.doneAt + INTERVALS[1] * DAY;
      if (at <= now) due.push({ e, id, box, due: at, misses: r?.misses ?? 0, item: ((e.items as string[] | undefined) ?? [id])[0] });
    }
  }
  // missed first, then the least-known box, then the longest waiting; one exercise per item for variety
  due.sort((a, b) => b.misses - a.misses || a.box - b.box || a.due - b.due);
  const items = new Set<string>();
  const pick: Cand[] = [];
  for (const c of due) {
    if (items.has(c.item)) continue;
    items.add(c.item);
    if (pick.length < PRACTICE_SIZE) pick.push(c);
  }
  const steps = withHelp(pick.map((c) => exercise(c.e, c.id)).filter((s): s is LessonStep => !!s));
  return { steps, dueItems: items.size, missed: pick.filter((c) => c.box === 0).length };
}

/** A saved position for this lesson or check, if it was saved for these exact steps (a re-export starts fresh). */
export function resumeFor(activityId: string, steps: LessonStep[]) {
  const sig = createHash("sha1").update(steps.map((s) => s.id).join("|")).digest("hex").slice(0, 16);
  const saved = getLessonState(LEARNER.id, activityId, sig);
  const ok = saved && saved.at > 0 && saved.at < saved.queue.length && saved.queue.every((i) => i >= 0 && i < steps.length);
  return { sig, resume: ok ? saved : null };
}

/** Fixes to her reports she hasn't seen, ready for the "Lo arreglamos" sheet at the start of her next lesson. */
export function fixesToShow(learnerId: string) {
  return pendingFixes(learnerId).map(({ report, fix }) => {
    let what = report.target_id;
    try {
      const s = JSON.parse(report.snapshot ?? "{}");
      what = s.sentence ?? s.prompt ?? s.card?.es ?? s.card?.title ?? s.card?.verb ?? what;
    } catch {}
    return { id: report.id, what: String(what).slice(0, 140), note: fix.note, changed: !!fix.changed };
  });
}
export type FixNote = ReturnType<typeof fixesToShow>[number];
