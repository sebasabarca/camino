"use client";
// The teach-then-quiz player (lesson format). Cards teach a word, a rule or a conjugation in a line or two;
// then Duolingo-style exercises. Sound is optional: small speaker buttons, nothing ever plays on its own.
// In a lesson, a miss gets a hint and another go, and any exercise she missed comes back once at the end.
// In the unit check, each item gets one try and no hints.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenText, ChevronRight, Flag, Lightbulb, Wrench, X } from "lucide-react";
import type { Card, Example, LessonStep } from "@/lib/lesson-steps";
import { enye, letterDiff, matches, normalize } from "@/lib/answer";
import type { SavedLesson } from "@/lib/db";
import type { FixNote } from "@/lib/help";
import { stopSpeaking } from "@/lib/speech";
import { acknowledgeFixes, markActivity, saveAttempt, saveLessonState, sendReport } from "@/app/actions";
import { MushroomSays } from "./mushroom";
import { BottomBar, FeedbackSheet, PRAISE, Primary, SpeakButton, TaskHead, pick, type Verdict } from "./ui";

type Quiz = Exclude<LessonStep, { kind: "teach" }>;
type Judge = (ok: boolean, answer: string) => void;

export type Mode = "lesson" | "check" | "practice";

export function LessonPlayer(props: {
  activityId: string;
  unitId?: string;
  sessionId?: string;
  steps: LessonStep[];
  mode: Mode;
  nextId?: string | null;
  /** where practice or a delayed check ends (the score is appended) */
  doneHref?: string;
  exitHref?: string;
  /** lesson and check: saved position, matched to the steps by `sig` */
  sig?: string;
  resume?: SavedLesson | null;
  /** fixes to her earlier reports, shown once before the first step */
  fixes?: FixNote[];
}) {
  const { steps, mode } = props;
  const check = mode === "check";
  const saves = mode !== "practice" && !!props.sig;
  const router = useRouter();
  const [queue, setQueue] = useState<number[]>(() => props.resume?.queue ?? steps.map((_, i) => i));
  const [at, setAt] = useState(() => props.resume?.at ?? 0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [misses, setMisses] = useState(0);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [fixes, setFixes] = useState(props.fixes ?? []);
  const lastAnswer = useRef(new Map<string, string>());
  const [resumed, setResumed] = useState(!!props.resume);
  // exercises she answered after opening the card: a right answer then doesn't push the review further out
  const peeked = useRef(new Set<string>());
  // first-try results per exercise id: what the summary counts
  const first = useRef(new Map<string, boolean>(props.resume?.first ?? []));
  const step = steps[queue[at]];
  const retry = at >= steps.length;
  const exit = props.exitHref ?? (props.unitId ? `/unit/${props.unitId}` : "/");

  useEffect(() => {
    if (mode !== "practice") markActivity(props.activityId, "started");
    return () => stopSpeaking();
  }, [props.activityId, mode]);

  function advance() {
    stopSpeaking();
    setVerdict(null);
    setMisses(0);
    setResumed(false);
    if (at + 1 < queue.length) {
      if (saves) saveLessonState(props.activityId, props.sig!, { queue, at: at + 1, first: [...first.current] });
      return setAt(at + 1);
    }
    const quizzes = [...first.current.values()];
    const score = quizzes.length ? `?right=${quizzes.filter(Boolean).length}&of=${quizzes.length}${check ? "&check=1" : ""}` : "";
    if (mode !== "practice") markActivity(props.activityId, "completed");
    if (props.doneHref) return router.push(`${props.doneHref}${score}`);
    router.push(props.nextId ? `/learn/${props.nextId}` : `/session/${props.sessionId}/done${score}`);
  }

  // only an exercise's first try schedules review; retries and the unit check don't
  const review = (id: string) => (first.current.has(id) || check ? undefined : mode === "practice" ? "practice" : "lesson");

  function judge(ok: boolean, answer: string) {
    if (step.kind === "teach") return;
    lastAnswer.current.set(step.id, answer);
    const r = review(step.id);
    saveAttempt(step.id, answer, ok, r === "practice" && ok && peeked.current.has(step.id) ? undefined : r);
    if (!first.current.has(step.id)) first.current.set(step.id, ok);
    const solution = "answer" in step ? step.answer : undefined;
    const spanish = step.kind !== "pick" || step.ask !== "meaning";
    if (ok) {
      // n for ñ is accepted; say how it is spelled
      const n = step.kind === "fill" || step.kind === "tiles" ? enye(answer, step.keys) : null;
      const body = [n && `Se escribe con ñ: «${n}».`, step.tip].filter(Boolean).join(" ") || undefined;
      setVerdict({ ok, title: pick(PRAISE, step.id + at), body, say: spanish ? solution : undefined, final: true });
      return;
    }
    // in the unit check there is one try; in a lesson or practice, a hint and another go first
    const final = check || misses >= 1;
    setMisses(misses + 1);
    if (final && !check && !retry && !queue.slice(at + 1).includes(queue[at])) setQueue((q) => [...q, q[at]]);
    // typed answers that are nearly right: mark the letters (first miss: hers only, so the retry still counts)
    const diff = step.kind === "fill" ? letterDiff(answer, step.keys) : null;
    const leaks = !!(step.hint && solution && normalize(step.hint).includes(normalize(solution)));
    const nudge = diff ? "Muy cerca. Revisa las letras marcadas." : step.hint && !leaks ? step.hint : "Piénsalo otra vez. Tienes otro intento.";
    setVerdict({
      ok,
      title: final ? "Así se dice" : "Casi",
      body: final ? (diff ? "" : (solution ?? "")) + (!check && !retry ? (diff ? "Volverá al final." : " · Volverá al final.") : "") : nudge,
      diff: diff ? (final ? { label: "Respuesta", segs: diff.right } : { label: "Tu respuesta", segs: diff.mine }) : undefined,
      say: final && spanish ? solution : undefined,
      final,
    });
  }

  const progress = Math.min(at / queue.length, 1);
  const cards = !check && step.kind !== "teach" ? step.cards : undefined;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-crema/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-sm">
        <Link href={exit} aria-label={mode === "practice" ? "Salir del repaso" : "Salir de la lección"} className="grid size-12 place-items-center rounded-full text-pebble hover:bg-crema-mid">
          <X className="size-6" strokeWidth={2.25} />
        </Link>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Progreso">
          <div className="h-full rounded-full bg-terra transition-[width] duration-700 ease-[var(--ease-out-expo)]" style={{ width: `${Math.max(progress * 100, 3)}%` }} />
        </div>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          disabled={!!verdict && verdict.final === false}
          aria-label="Algo está mal en este ejercicio"
          className="grid size-12 shrink-0 place-items-center rounded-full text-pebble hover:bg-crema-mid disabled:opacity-40"
        >
          <Flag className="size-5" strokeWidth={2.25} aria-hidden />
        </button>
        {cards?.length ? (
          <button
            type="button"
            onClick={() => { peeked.current.add(step.id); setCardsOpen(true); }}
            disabled={!!verdict}
            aria-label="Ver la tarjeta de esta lección"
            className="flex min-h-12 items-center gap-1.5 rounded-full px-3 font-label text-[14px] font-bold text-terra-deep hover:bg-terra-wash disabled:opacity-40"
          >
            <BookOpenText className="size-5" strokeWidth={2.25} aria-hidden /> Tarjeta
          </button>
        ) : null}
      </header>

      <main className="flex flex-1 flex-col px-5 pb-40 pt-2" key={`${step.id}-${at}`}>
        {resumed && <p className="mb-3 font-label text-[13px] font-semibold text-agave-deep">Seguimos donde lo dejaste</p>}
        {retry && <p className="mb-3 font-label text-[13px] font-semibold text-canela-deep">Otra vez: este se te resistió</p>}
        {step.kind === "teach" ? (
          <TeachStep step={step} onNext={advance} />
        ) : (
          <QuizStep step={step} onJudge={judge} locked={!!verdict} onNext={advance} help={!check} review={review(step.id)} />
        )}
      </main>

      {cardsOpen && cards && <CardSheet cards={cards} onClose={() => setCardsOpen(false)} />}
      {reportOpen && (
        <ReportSheet
          onClose={() => setReportOpen(false)}
          onSend={(reason, note) =>
            sendReport({
              targetId: step.id, activityId: props.activityId, reason, note,
              answer: lastAnswer.current.get(step.id),
              snapshot: JSON.stringify({ ...step, cards: undefined, gloss: undefined }),
            })
          }
        />
      )}
      {fixes.length > 0 && (
        <FixesSheet
          fixes={fixes}
          onClose={() => {
            acknowledgeFixes(fixes.map((f) => f.id));
            setFixes([]);
          }}
        />
      )}
      {verdict && <FeedbackSheet v={verdict} onContinue={verdict.final ? advance : () => setVerdict(null)} />}
    </div>
  );
}

function Sheet({ label, children, footer, onClose }: { label: string; children: React.ReactNode; footer: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[rgba(44,34,30,0.35)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-auto flex max-h-[88dvh] w-full max-w-[30rem] animate-[sheet-rise_420ms_var(--ease-out-expo)] flex-col rounded-t-[2rem] bg-crema shadow-[0_-10px_28px_rgba(44,34,30,0.14)]"
      >
        <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-4 pt-6">{children}</div>
        <div className="flex flex-col gap-2 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2">{footer}</div>
      </div>
    </div>
  );
}

const REPORT_REASONS: [string, string][] = [
  ["wrong_answer", "La respuesta correcta está mal"],
  ["accept_mine", "Mi respuesta también debería valer"],
  ["not_taught", "Esto no me lo enseñaron"],
  ["unclear", "No se entiende"],
  ["other", "Otra cosa"],
];

/** "Algo está mal": she flags an exercise or card. It is kept, fixed in the course, and she is told at a later lesson. */
function ReportSheet({ onClose, onSend }: { onClose: () => void; onSend: (reason: string, note: string) => Promise<boolean> }) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"edit" | "sending" | "sent" | "failed">("edit");
  const send = async () => {
    if (!reason) return;
    setState("sending");
    setState((await onSend(reason, note).catch(() => false)) ? "sent" : "failed");
  };
  if (state === "sent")
    return (
      <Sheet label="Gracias" onClose={onClose} footer={<Primary onClick={onClose}>Seguir con la lección</Primary>}>
        <MushroomSays mood="proud">¡Gracias! Lo revisamos y te aviso cuando esté arreglado.</MushroomSays>
      </Sheet>
    );
  return (
    <Sheet
      label="Algo está mal"
      onClose={onClose}
      footer={
        <>
          <Primary disabled={!reason || state === "sending"} onClick={send}>{state === "sending" ? "Enviando…" : "Enviar"}</Primary>
          <button type="button" onClick={onClose} className="min-h-12 font-label text-[15px] font-semibold text-pebble">Cancelar</button>
        </>
      }
    >
      <TaskHead title="¿Qué está mal?" sub="Tu aviso se guarda y corregimos la lección." />
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Qué está mal">
        {REPORT_REASONS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={reason === k}
            onClick={() => setReason(k)}
            className={`min-h-14 rounded-[1.25rem] border-[1.5px] px-4 text-left text-[16px] leading-6 transition ${
              reason === k ? "border-terra bg-terra-wash font-semibold text-terra-deep" : "border-[rgba(44,34,30,0.08)] bg-white text-espresso"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <label htmlFor="report-note" className="font-label text-[14px] font-semibold text-pebble">Cuéntanos más (opcional)</label>
      <textarea
        id="report-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Por ejemplo: escribí «Soy de Canadá» y me dijo que no."
        className="card w-full px-4 py-3 text-[16px] leading-6 text-espresso outline-none placeholder:text-pebble focus:border-terra"
      />
      {state === "failed" && <p role="alert" className="text-[15px] text-terra-deep">No se pudo enviar. Inténtalo otra vez.</p>}
    </Sheet>
  );
}

/** Before the first step: what was done about her earlier reports. */
function FixesSheet({ fixes, onClose }: { fixes: FixNote[]; onClose: () => void }) {
  const changed = fixes.some((f) => f.changed);
  return (
    <Sheet label="Lo arreglamos" onClose={onClose} footer={<Primary onClick={onClose}>¡Gracias!</Primary>}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-agave-wash text-agave-deep">
          <Wrench className="size-5" strokeWidth={2.3} aria-hidden />
        </span>
        <TaskHead title={changed ? "Arreglamos lo que reportaste" : "Revisamos lo que reportaste"} />
      </div>
      <ul className="card divide-y divide-[rgba(74,52,42,0.08)] px-5">
        {fixes.map((f) => (
          <li key={f.id} className="py-3.5">
            <p className="text-[17px] font-semibold leading-6 text-espresso">{f.what}</p>
            <p className="mt-1 text-[15px] leading-[22px] text-pebble">{f.note}</p>
          </li>
        ))}
      </ul>
      {changed && <p className="text-[15px] leading-[22px] text-pebble">Los ejercicios corregidos vuelven en Practicar.</p>}
    </Sheet>
  );
}

/** The teach cards behind the current exercise, over the quiz. Closing returns to the same exercise. */
function CardSheet({ cards, onClose }: { cards: Card[]; onClose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[rgba(44,34,30,0.35)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tarjetas"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-auto flex max-h-[88dvh] w-full max-w-[30rem] animate-[sheet-rise_420ms_var(--ease-out-expo)] flex-col rounded-t-[2rem] bg-crema shadow-[0_-10px_28px_rgba(44,34,30,0.14)]"
      >
        <div className="flex flex-col gap-8 overflow-y-auto px-5 pb-6 pt-6">
          {cards.map((c, i) => <CardView key={i} card={c} />)}
        </div>
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2">
          <button ref={ref} type="button" onClick={onClose} className="pill w-full bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none">
            Volver al ejercicio
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- teaching ---------------- */

function Hear({ es }: { es: string }) {
  return <SpeakButton lines={[{ text: es, who: "mushroom" }]} label={`Escuchar: ${es}`} />;
}

function ExampleList({ items }: { items: Example[] }) {
  if (!items.length) return null;
  return (
    <ul className="card divide-y divide-[rgba(74,52,42,0.08)] px-5">
      {items.map((e, i) => (
        <li key={i} className="flex items-center gap-3 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-semibold leading-6 text-espresso">{e.es}</p>
            {e.en && <p className="mt-0.5 text-[15px] leading-[22px] text-pebble">{e.en}</p>}
          </div>
          <Hear es={e.es} />
        </li>
      ))}
    </ul>
  );
}

const CARD_TITLE: Record<Card["kind"], string> = {
  word: "New word",
  phrase: "New phrase",
  rule: "How it works",
  conjugation: "Verb forms",
  tip: "Good to know",
};

function TeachStep({ step, onNext }: { step: Extract<LessonStep, { kind: "teach" }>; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <CardView card={step.card} sub={step.count > 1 ? `${step.pos} of ${step.count}` : undefined} />
      <BottomBar><Primary onClick={onNext}>Entendido <ChevronRight className="size-5" /></Primary></BottomBar>
    </div>
  );
}

/** One teach card. Used by the lesson and by the "Tarjeta" sheet during a quiz. */
function CardView({ card: c, sub }: { card: Card; sub?: string }) {
  return (
    <div className="flex flex-col gap-5">
      {(c.kind === "word" || c.kind === "phrase") && (
        <>
          <TaskHead title={CARD_TITLE[c.kind]} sub={sub} />
          <section className="card flex flex-col gap-2 px-6 py-7">
            <div className="flex items-start gap-3">
              <p className="min-w-0 flex-1 text-balance text-[30px] font-extrabold leading-9 tracking-[-0.02em] text-espresso">{c.es}</p>
              <Hear es={c.es} />
            </div>
            <p className="text-[19px] font-semibold leading-7 text-terra-deep">{c.en}</p>
            {c.note && <p className="mt-1 text-[15px] leading-[22px] text-pebble">{c.note}</p>}
          </section>
          {c.example && <ExampleList items={[c.example]} />}
        </>
      )}
      {c.kind === "rule" && (
        <>
          <TaskHead title={c.title || CARD_TITLE.rule} sub={sub} />
          <p className="text-[18px] leading-[28px] text-espresso">{c.body}</p>
          {c.pattern && (
            <p className="self-start rounded-[1rem] bg-canela-wash px-4 py-2.5 text-[19px] font-bold leading-7 text-canela-deep">{c.pattern}</p>
          )}
          <ExampleList items={c.examples} />
        </>
      )}
      {c.kind === "conjugation" && (
        <>
          <TaskHead title={`${c.verb}: ${c.meaning}`} sub={sub ? `${CARD_TITLE.conjugation} · ${sub}` : CARD_TITLE.conjugation} />
          <table className="card w-full overflow-hidden text-left">
            <caption className="sr-only">Formas de {c.verb}</caption>
            <tbody className="divide-y divide-[rgba(74,52,42,0.08)]">
              {c.forms.map((f) => (
                <tr key={f.person}>
                  <th scope="row" className="w-[28%] py-4 pl-5 font-label text-[15px] font-semibold text-pebble">{f.person}</th>
                  <td className="py-4 text-[22px] font-extrabold leading-7 text-espresso">{f.es}</td>
                  <td className="py-4 pr-5 text-right text-[15px] leading-[22px] text-pebble">{f.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {c.note && <p className="text-[16px] leading-6 text-espresso">{c.note}</p>}
        </>
      )}
      {c.kind === "tip" && (
        <>
          <TaskHead title={CARD_TITLE.tip} sub={sub} />
          <MushroomSays mood="teaching">{c.body}</MushroomSays>
          <ExampleList items={c.examples} />
        </>
      )}
    </div>
  );
}

/* ---------------- quizzing ---------------- */

function heading(s: Quiz): { title: string; sub: string } {
  switch (s.kind) {
    case "pick":
      return s.ask === "meaning"
        ? { title: "What does this mean?", sub: "Choose one answer." }
        : s.ask === "spanish"
          ? { title: "Choose the Spanish", sub: "Choose one answer." }
          : { title: "Fill in the gap", sub: "Choose the missing word." };
    case "match":
      return { title: "Match the pairs", sub: "Tap a Spanish word, then its meaning." };
    case "tiles":
      return { title: "Build it in Spanish", sub: "Tap the words in order." };
    case "fill":
      return s.ask === "conjugate"
        ? { title: "Write the verb form", sub: "Accents are optional." }
        : s.ask === "gap"
          ? { title: "Fill in the gap", sub: "Type the missing word. Accents are optional." }
          : { title: "Write this in Spanish", sub: "Accents are optional." };
  }
}

type Review = "lesson" | "practice" | undefined;

function QuizStep({ step, onJudge, locked, onNext, help, review }: {
  step: Quiz; onJudge: Judge; locked: boolean; onNext: () => void; help: boolean; review: Review;
}) {
  const h = heading(step);
  const gloss = help ? step.gloss : undefined;
  return (
    <div className="flex flex-col gap-6">
      <TaskHead title={h.title} sub={h.sub} />
      {step.kind === "pick" && <PickStep step={step} onJudge={onJudge} locked={locked} gloss={gloss} />}
      {step.kind === "match" && <MatchStep step={step} onNext={onNext} review={review} />}
      {step.kind === "tiles" && <TilesStep step={step} onJudge={onJudge} locked={locked} />}
      {step.kind === "fill" && <FillStep step={step} onJudge={onJudge} locked={locked} gloss={gloss} />}
    </div>
  );
}

const WORD = /([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)/;
const foldWord = (w: string) =>
  w.toLowerCase().replace(/ñ/g, "\u0000").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0000/g, "ñ");

/** Sentence text where words with a known meaning can be tapped (dotted underline). */
function Words({ text, gloss, onTap }: { text: string; gloss?: Record<string, string>; onTap: (w: string) => void }) {
  if (!gloss) return <>{text}</>;
  return (
    <>
      {text.split(WORD).map((part, i) => {
        const en = i % 2 ? gloss[foldWord(part)] : undefined;
        return en ? (
          <button
            key={i}
            type="button"
            onClick={() => onTap(part)}
            className="rounded-sm underline decoration-sand-deep decoration-dotted decoration-2 underline-offset-[6px] active:bg-terra-wash"
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

/** A sentence with its ___ gap drawn as a blank (or filled with `fill`). Known words can be tapped for their meaning. */
function Gapped({ sentence, fill, gloss }: { sentence: string; fill?: string; gloss?: Record<string, string> }) {
  const [a, ...rest] = sentence.split(/_{2,}/);
  const [word, setWord] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[24px] font-bold leading-[34px] tracking-[-0.01em] text-espresso">
        <Words text={a} gloss={gloss} onTap={setWord} />
        <span className={`mx-1 inline-block min-w-[3.5ch] border-b-[3px] px-1 text-center ${fill ? "border-terra text-terra-deep" : "border-sand-deep text-transparent"}`}>
          {fill || "—"}
        </span>
        <Words text={rest.join("___")} gloss={gloss} onTap={setWord} />
      </p>
      <p aria-live="polite" className="min-h-6 text-[15px] leading-6">
        {word && gloss ? (
          <span className="rounded-full bg-canela-wash px-3 py-1 font-semibold text-canela-deep">
            {word} = {gloss[foldWord(word)]}
          </span>
        ) : gloss ? (
          <span className="text-pebble">Toca una palabra subrayada para ver qué significa.</span>
        ) : null}
      </p>
    </div>
  );
}

function Prompt({ children, es }: { children: React.ReactNode; es?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[1.25rem] bg-crema-mid px-5 py-4">
      <div className="min-w-0 flex-1">{children}</div>
      {es && <Hear es={es} />}
    </div>
  );
}

function PickStep({ step, onJudge, locked, gloss }: { step: Extract<Quiz, { kind: "pick" }>; onJudge: Judge; locked: boolean; gloss?: Record<string, string> }) {
  const [sel, setSel] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const check = () => {
    if (!sel) return;
    const ok = sel === step.answer;
    if (!ok) setWrong((w) => [...w, sel]);
    onJudge(ok, sel);
    if (!ok) setSel(null);
  };
  return (
    <>
      {step.ask === "meaning" && (
        <Prompt es={step.prompt}><p className="text-[26px] font-bold leading-8 tracking-[-0.015em] text-espresso">{step.prompt}</p></Prompt>
      )}
      {step.ask === "spanish" && (
        <Prompt><p className="text-[22px] font-bold leading-8 text-espresso">{step.prompt}</p></Prompt>
      )}
      {step.ask === "gap" && step.sentence && (
        <div className="flex flex-col gap-2">
          <Gapped sentence={step.sentence} fill={sel ?? undefined} gloss={gloss} />
          {step.prompt && <p className="text-[16px] leading-6 text-pebble">{step.prompt}</p>}
        </div>
      )}
      <div className="flex flex-col gap-3" role="radiogroup" aria-label={heading(step).title}>
        {step.choices.map((c, i) => {
          const isSel = sel === c;
          const isWrong = wrong.includes(c);
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={isSel}
              disabled={locked || isWrong}
              onClick={() => setSel(c)}
              className={`flex min-h-16 items-center gap-4 rounded-[1.25rem] border-[1.5px] px-4 py-3 text-left transition duration-150 active:translate-y-0.5 ${
                isSel
                  ? "border-terra bg-terra-wash shadow-[var(--shadow-press)]"
                  : isWrong
                    ? "animate-[shake_360ms] border-transparent bg-crema-mid opacity-55"
                    : "border-[rgba(44,34,30,0.08)] bg-white shadow-[var(--shadow-card)]"
              }`}
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-full font-label text-[14px] font-bold ${isSel ? "bg-terra-deep text-white" : "bg-crema-mid text-pebble"}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={`text-[17px] leading-6 ${isSel ? "font-semibold text-terra-deep" : "text-espresso"}`}>{c}</span>
            </button>
          );
        })}
      </div>
      <BottomBar><Primary disabled={!sel || locked} onClick={check}>Comprobar</Primary></BottomBar>
    </>
  );
}

function MatchStep({ step, onNext, review }: { step: Extract<Quiz, { kind: "match" }>; onNext: () => void; review: Review }) {
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]); // matched Spanish sides
  const [bad, setBad] = useState<[string, string] | null>(null);
  const [slips, setSlips] = useState(0);
  const enOf = (es: string) => step.pairs.find((p) => p.es === es)!.en;
  const complete = done.length === step.pairs.length;

  useEffect(() => {
    if (!left || !right) return;
    if (enOf(left) === right) setDone((d) => [...d, left]);
    else {
      setBad([left, right]);
      setSlips((n) => n + 1);
    }
    const t = setTimeout(() => { setLeft(null); setRight(null); setBad(null); }, 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, right]);

  useEffect(() => {
    if (complete) saveAttempt(step.id, `match:${slips} slips`, slips === 0, review);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);

  const tile = (label: string, side: "l" | "r") => {
    const matched = side === "l" ? done.includes(label) : done.some((es) => enOf(es) === label);
    const selected = side === "l" ? left === label : right === label;
    const wrong = bad && (side === "l" ? bad[0] === label : bad[1] === label);
    return (
      <button
        key={label}
        type="button"
        aria-pressed={selected}
        disabled={matched}
        onClick={() => (side === "l" ? setLeft(label) : setRight(label))}
        className={`min-h-16 w-full rounded-[1.25rem] border-[1.5px] px-3 py-3 text-center text-[16px] leading-6 transition active:translate-y-0.5 ${
          matched
            ? "border-transparent bg-agave-wash text-agave-deep opacity-70"
            : wrong
              ? "animate-[shake_360ms] border-terra bg-[#f6e7d4] text-terra-deep"
              : selected
                ? "border-terra bg-terra-wash font-semibold text-terra-deep"
                : "border-[rgba(44,34,30,0.08)] bg-white text-espresso shadow-[var(--shadow-card)]"
        } ${side === "l" ? "font-semibold" : ""}`}
      >
        {label}
      </button>
    );
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">{step.pairs.map((p) => tile(p.es, "l"))}</div>
        <div className="flex flex-col gap-3">{step.right.map((en) => tile(en, "r"))}</div>
      </div>
      {complete && step.tip && <MushroomSays mood="excited" size={64}>{step.tip}</MushroomSays>}
      <BottomBar>
        <Primary tone={complete ? "agave" : "terra"} disabled={!complete} onClick={onNext}>
          {complete ? <>Continuar <ChevronRight className="size-5" /></> : "Empareja todo"}
        </Primary>
      </BottomBar>
    </>
  );
}

function TilesStep({ step, onJudge, locked }: { step: Extract<Quiz, { kind: "tiles" }>; onJudge: Judge; locked: boolean }) {
  const [picked, setPicked] = useState<number[]>([]); // indices into the bank, in answer order
  const sentence = picked.map((i) => step.bank[i]).join(" ");
  // after a miss she rebuilds from scratch
  const check = () => {
    const ok = matches(sentence, step.keys);
    onJudge(ok, sentence);
    if (!ok) setPicked([]);
  };
  return (
    <>
      <Prompt><p className="text-[20px] font-bold leading-7 text-espresso">{step.prompt}</p></Prompt>
      <div className="flex min-h-[7.5rem] flex-wrap content-start gap-2 border-b-2 border-t-2 border-[rgba(74,52,42,0.10)] py-3" aria-label="Tu frase" aria-live="polite">
        {picked.map((i, k) => (
          <button
            key={`${i}-${k}`}
            type="button"
            disabled={locked}
            onClick={() => setPicked((p) => p.filter((_, j) => j !== k))}
            className="min-h-12 rounded-[0.9rem] border-[1.5px] border-[rgba(44,34,30,0.10)] bg-white px-3.5 text-[17px] font-semibold text-espresso shadow-[0_2px_0_rgba(44,34,30,0.10)] active:translate-y-0.5"
          >
            {step.bank[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2" aria-label="Palabras">
        {step.bank.map((w, i) => {
          const used = picked.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={used || locked}
              onClick={() => setPicked((p) => [...p, i])}
              className={`min-h-12 rounded-[0.9rem] border-[1.5px] px-3.5 text-[17px] font-semibold transition active:translate-y-0.5 ${
                used ? "border-transparent bg-sand text-transparent" : "border-[rgba(44,34,30,0.10)] bg-white text-espresso shadow-[0_2px_0_rgba(44,34,30,0.10)]"
              }`}
            >
              {w}
            </button>
          );
        })}
      </div>
      <BottomBar><Primary disabled={!picked.length || locked} onClick={check}>Comprobar</Primary></BottomBar>
    </>
  );
}

function FillStep({ step, onJudge, locked, gloss }: { step: Extract<Quiz, { kind: "fill" }>; onJudge: Judge; locked: boolean; gloss?: Record<string, string> }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  const check = () => {
    if (!v.trim()) return;
    const ok = matches(v, step.keys);
    onJudge(ok, v);
    if (!ok) setV("");
  };
  return (
    <>
      {step.label && (
        <p className="flex items-center gap-2 self-start rounded-full bg-canela-wash px-4 py-2 font-label text-[15px] font-bold text-canela-deep">
          <Lightbulb className="size-4" aria-hidden /> {step.label}
        </p>
      )}
      {step.sentence ? (
        <div className="flex flex-col gap-2">
          <Gapped sentence={step.sentence} fill={v.trim() || undefined} gloss={gloss} />
          {step.prompt && <p className="text-[16px] leading-6 text-pebble">{step.prompt}</p>}
        </div>
      ) : (
        step.prompt && <Prompt><p className="text-[22px] font-bold leading-8 text-espresso">{step.prompt}</p></Prompt>
      )}
      <form onSubmit={(e) => { e.preventDefault(); if (!locked) check(); }}>
        <label htmlFor="answer" className="sr-only">Tu respuesta en español</label>
        <input
          id="answer"
          ref={ref}
          value={v}
          onChange={(e) => setV(e.target.value)}
          readOnly={locked}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          lang="es"
          enterKeyHint="done"
          placeholder="Escribe en español"
          className="card min-h-16 w-full px-5 text-[19px] font-semibold text-espresso outline-none placeholder:font-normal placeholder:text-pebble focus:border-terra"
        />
        <BottomBar><Primary disabled={!v.trim() || locked} onClick={check}>Comprobar</Primary></BottomBar>
      </form>
    </>
  );
}
