"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Eye, Mic, RotateCcw, Snail, Volume2, X } from "lucide-react";
import type { Line, Step } from "@/lib/steps";
import { matches, normalize } from "@/lib/answer";
import { prefersSlow, speak, stopSpeaking } from "@/lib/speech";
import { markActivity, saveAttempt } from "@/app/actions";
import { Mushroom, MushroomSays, type Mood } from "./mushroom";

type Verdict = { ok: boolean; title: string; body?: string; say?: string; final: boolean } | null;

export function Player(props: {
  activityId: string;
  unitId: string;
  sessionId: string;
  intro: string;
  steps: Step[];
  index: number;
  total: number;
  nextId: string | null;
}) {
  const { steps, index, total } = props;
  const router = useRouter();
  const [at, setAt] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [misses, setMisses] = useState(0);
  const step = steps[at];

  useEffect(() => {
    markActivity(props.activityId, "started");
    return () => stopSpeaking();
  }, [props.activityId]);

  const progress = (index + at / steps.length) / total;

  function advance() {
    stopSpeaking();
    setVerdict(null);
    setMisses(0);
    if (at + 1 < steps.length) return setAt(at + 1);
    markActivity(props.activityId, "completed");
    router.push(props.nextId ? `/learn/${props.nextId}` : `/session/${props.sessionId}/done`);
  }

  // A check: right → sage sheet; wrong → sand sheet with a hint and another go; second miss shows the answer.
  function judge(ok: boolean, answer: string, hint?: string, solution?: string, praise?: string, spanish = false) {
    saveAttempt(step.id, answer, ok);
    const say = spanish ? solution : undefined;
    if (ok) {
      const plain = !praise || ["correct", "yes", "good", "right"].includes(normalize(praise));
      setVerdict({ ok, title: pick(PRAISE, step.id), body: plain ? undefined : praise, say, final: true });
      if (say) speak([{ text: say }]);
    } else {
      const final = misses >= 1;
      setMisses(misses + 1);
      // a hint that contains the answer would make the retry pointless
      const leaks = !!(hint && solution && normalize(hint).includes(normalize(solution)));
      const nudge = leaks || !hint ? "Piénsalo otra vez. Tienes otro intento." : hint;
      setVerdict({ ok, title: final ? "Así se dice" : "Casi", body: final ? solution : nudge, say: final ? say : undefined, final });
      if (final && say) speak([{ text: say }]);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-crema/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-sm">
        <Link href={`/unit/${props.unitId}`} aria-label="Salir de la lección" className="grid size-12 place-items-center rounded-full text-pebble hover:bg-crema-mid">
          <X className="size-6" strokeWidth={2.25} />
        </Link>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Progreso de la sesión">
          <div className="h-full rounded-full bg-terra transition-[width] duration-700 ease-[var(--ease-out-expo)]" style={{ width: `${Math.max(progress * 100, 3)}%` }} />
        </div>
        <span className="font-label tabular w-12 text-right text-[13px] font-semibold text-pebble">{index + 1}/{total}</span>
      </header>

      <main className="flex flex-1 flex-col px-5 pb-40 pt-2" key={step.id}>
        <StepView step={step} intro={at === 0 ? doable(props.intro, step) : undefined} onJudge={judge} onNext={advance} locked={!!verdict} />
      </main>

      {verdict && <FeedbackSheet v={verdict} onContinue={verdict.final ? advance : () => setVerdict(null)} />}
    </div>
  );
}

// Explanation intros sometimes ask for interactions the pilot doesn't have ("Highlight…", "tap the lines…").
// Drop those sentences and keep the rest (usually Mushroom's quip). See pipeline/docs/app-content-notes.md.
function doable(intro: string, step: Step) {
  if (step.kind !== "learn") return intro;
  // if any sentence asks for something the screen can't do, drop the whole balloon: the rest would be a non-sequitur
  return /\b(highlight|underline|tap the|mark the)\b/i.test(intro) ? undefined : intro;
}

const PRAISE = ["¡Excelente!", "¡Muy bien!", "¡Eso es!", "¡Perfecto!", "¡Bien dicho!"];
const pick = (xs: string[], seed: string) => xs[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % xs.length];

/* ---------------- shared bits ---------------- */

function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[30rem] bg-gradient-to-t from-crema from-70% to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-8">
      {children}
    </div>
  );
}

function Primary({ children, disabled, onClick, tone = "terra" }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void; tone?: "terra" | "agave" }) {
  const c =
    tone === "agave"
      ? "bg-agave-deep text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.22)] active:translate-y-0.5 active:shadow-none"
      : "bg-terra-deep text-white shadow-[inset_0_-3px_0_#7a2a0c] active:translate-y-0.5 active:shadow-none";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`pill w-full ${c} disabled:bg-sand disabled:text-pebble/70 disabled:shadow-none`}>
      {children}
    </button>
  );
}

function SpeakButton({ lines, label = "Escuchar", big }: { lines: Line[]; label?: string; big?: boolean }) {
  const [slow, setSlow] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => setSlow(prefersSlow()), []);
  const play = (s = slow) => {
    setPlaying(true);
    speak(lines.map((l) => ({ text: l.text, who: l.who })), { slow: s, onEnd: () => setPlaying(false) });
  };
  if (!big)
    return (
      <button type="button" onClick={() => play(false)} aria-label={label} className="grid size-12 shrink-0 place-items-center rounded-full bg-terra-wash text-terra-deep transition active:scale-95">
        <Volume2 className="size-5" strokeWidth={2.25} />
      </button>
    );
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={() => play()}
        aria-label={label}
        className={`grid size-24 place-items-center rounded-full bg-terra text-white shadow-[0_10px_24px_rgba(200,90,50,0.32)] ring-8 ring-terra-wash transition active:scale-95 ${playing ? "animate-[pop_600ms_var(--ease-out-expo)_infinite_alternate]" : ""}`}
      >
        <Volume2 className="size-9" strokeWidth={2.25} />
      </button>
      <div className="flex rounded-full bg-crema-mid p-1 font-label text-[13px] font-semibold" role="radiogroup" aria-label="Velocidad">
        {[false, true].map((s) => (
          <button
            key={String(s)}
            type="button"
            role="radio"
            aria-checked={slow === s}
            onClick={() => { setSlow(s); play(s); }}
            className={`flex min-h-10 items-center gap-1.5 rounded-full px-4 ${slow === s ? "bg-white text-terra-deep shadow-[var(--shadow-press)]" : "text-pebble"}`}
          >
            {s ? <><Snail className="size-4" /> Despacio</> : <>Normal</>}
          </button>
        ))}
      </div>
    </div>
  );
}

const Buddy = createContext<Mood | null>(null);

function Heading({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  const mood = useContext(Buddy);
  return (
    <div className="flex items-center gap-3">
      {mood && <Mushroom mood={mood} size={60} />}
      <h1 className="min-w-0 flex-1 text-balance text-[24px] font-bold leading-8 tracking-[-0.015em] text-espresso">{children}</h1>
      {extra}
    </div>
  );
}

/* ---------------- step views ---------------- */

type Judge = (ok: boolean, answer: string, hint?: string, solution?: string, praise?: string, spanish?: boolean) => void;

function StepView({ step, intro, onJudge, onNext, locked }: { step: Step; intro?: string; onJudge: Judge; onNext: () => void; locked: boolean }) {
  const mood: Mood = step.kind === "listen" ? "listening" : step.kind === "learn" ? "teaching" : step.kind === "say" ? "curious" : "thinking";
  return (
    <Buddy.Provider value={intro ? null : mood}>
    <div className="flex flex-col gap-6">
      {intro && <MushroomSays mood={mood}>{intro}</MushroomSays>}
      {step.kind === "listen" && <ListenStep step={step} onNext={onNext} />}
      {step.kind === "learn" && <LearnStep step={step} onNext={onNext} />}
      {step.kind === "choice" && <ChoiceStep step={step} onJudge={onJudge} locked={locked} />}
      {step.kind === "type" && <TypeStep step={step} onJudge={onJudge} locked={locked} />}
      {step.kind === "say" && <SayStep step={step} onNext={onNext} />}
      {step.kind === "write" && <WriteStep step={step} onNext={onNext} />}
      {step.kind === "rate" && <RateStep step={step} onNext={onNext} />}
    </div>
    </Buddy.Provider>
  );
}

function ListenStep({ step, onNext }: { step: Extract<Step, { kind: "listen" }>; onNext: () => void }) {
  const [shown, setShown] = useState(step.reveal === "always" || !step.lines);
  if (step.text && !step.lines)
    return (
      <>
        <Heading>Lee con calma</Heading>
        <article className="card whitespace-pre-line p-6 text-[17px] leading-[28px] text-espresso">{step.text}</article>
        <BottomBar><Primary onClick={onNext}>Continuar <ChevronRight className="size-5" /></Primary></BottomBar>
      </>
    );
  return (
    <>
      <section className="card flex flex-col items-center gap-5 px-5 pb-5 pt-7">
        <SpeakButton lines={step.lines!} big label="Escuchar el diálogo" />
        {!shown ? (
          <button type="button" onClick={() => setShown(true)} className="flex min-h-12 items-center gap-2 font-label text-[14px] font-semibold text-pebble">
            <Eye className="size-4" /> Mostrar texto
          </button>
        ) : (
          <ol className="w-full divide-y divide-[rgba(74,52,42,0.08)] border-t border-[rgba(74,52,42,0.08)]">
            {step.lines!.map((l, i) => (
              <li key={i}>
                <button type="button" onClick={() => speak([{ text: l.text, who: l.who }])} className="flex w-full flex-col items-start gap-0.5 py-3 text-left">
                  {l.name && <span className="font-label text-[12px] font-semibold text-terra-deep">{l.name}</span>}
                  <span className="text-[17px] font-semibold leading-[26px] text-espresso">{l.text}</span>
                  {l.en && <span className="text-[15px] italic leading-[22px] text-pebble">{l.en}</span>}
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
      <BottomBar><Primary onClick={onNext}>Continuar <ChevronRight className="size-5" /></Primary></BottomBar>
    </>
  );
}

function LearnStep({ step, onNext }: { step: Extract<Step, { kind: "learn" }>; onNext: () => void }) {
  const tutor = useContext(Buddy); // no intro balloon on this screen → Mushroom delivers the note himself
  return (
    <>
      {step.note && (tutor
        ? <MushroomSays mood="teaching">{step.note}</MushroomSays>
        : <p className="text-[17px] leading-[26px] text-espresso">{step.note}</p>)}
      {step.examples.length > 0 && (
        <ul className="card divide-y divide-[rgba(74,52,42,0.08)] px-5">
          {step.examples.map((e, i) => (
            <li key={i} className="flex items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-semibold leading-6 text-espresso">{e.es}</p>
                {e.en && <p className="mt-0.5 text-[15px] italic leading-[22px] text-pebble">{e.en}</p>}
              </div>
              <SpeakButton lines={[{ text: e.es, who: "mushroom" }]} label={`Escuchar: ${e.es}`} />
            </li>
          ))}
        </ul>
      )}
      <BottomBar><Primary onClick={onNext}>Entendido <ChevronRight className="size-5" /></Primary></BottomBar>
    </>
  );
}

function ChoiceStep({ step, onJudge, locked }: { step: Extract<Step, { kind: "choice" }>; onJudge: Judge; locked: boolean }) {
  const [sel, setSel] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const check = () => {
    if (!sel) return;
    const ok = sel === step.answer;
    if (!ok) setWrong((w) => [...w, sel]);
    onJudge(ok, sel, step.feedback.incorrect, step.answer, step.feedback.correct, step.qEs);
    if (!ok) setSel(null);
  };
  return (
    <>
      <Heading extra={step.hear && <SpeakButton lines={step.hear} label="Escuchar otra vez" />}>{step.q}</Heading>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label={step.q}>
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

function TypeStep({ step, onJudge, locked }: { step: Extract<Step, { kind: "type" }>; onJudge: Judge; locked: boolean }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  const check = () => v.trim() && onJudge(matches(v, step.keys), v, step.feedback.incorrect, step.answer, step.feedback.correct, true);
  return (
    <>
      <Heading>{step.cue}</Heading>
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
        <p className="mt-3 px-1 text-[13px] leading-[18px] text-pebble">Sin acentos también vale.</p>
        <BottomBar><Primary disabled={!v.trim() || locked} onClick={check}>Comprobar</Primary></BottomBar>
      </form>
    </>
  );
}

function SayStep({ step, onNext }: { step: Extract<Step, { kind: "say" }>; onNext: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>(() => step.selfCheck.map(() => false));
  useEffect(() => {
    if (step.hear) speak(step.hear.map((l) => ({ text: l.text, who: l.who })));
  }, [step]);
  const done = (ok: boolean) => {
    saveAttempt(step.id, ok ? "self:said-it" : "self:again", ok);
    onNext();
  };
  return (
    <>
      {step.hear && (
        <MushroomSays mood={step.hear[0].who.includes("mushroom") ? "curious" : "listening"} size={72}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              {step.hear[0].name && <p className="font-label text-[12px] font-semibold text-terra-deep">{step.hear[0].name}</p>}
              <p className="text-[22px] font-bold leading-[30px] tracking-[-0.01em] text-espresso">{step.hear.map((l) => l.text).join(" ")}</p>
            </div>
            <SpeakButton lines={step.hear} label="Escuchar otra vez" />
          </div>
        </MushroomSays>
      )}
      <div className="flex flex-col gap-2">
        {/* when Mushroom already speaks in the balloon above, the heading goes without him */}
        {step.cue && <Buddy.Provider value={step.hear ? null : "curious"}><Heading>{step.cue}</Heading></Buddy.Provider>}
        <p className="flex items-center gap-2 font-label text-[14px] font-semibold text-pebble">
          <Mic className="size-4 text-canela-deep" /> Contesta en voz alta.
        </p>
      </div>
      {step.frame && <p className="rounded-[1.25rem] border border-dashed border-sand-deep px-5 py-4 text-[17px] font-semibold leading-6 text-pebble">{step.frame}</p>}
      {revealed && step.target && (
        <div className="card flex animate-[pop_400ms_var(--ease-out-expo)] items-center gap-3 border-agave/25 bg-agave-wash p-5">
          <div className="min-w-0 flex-1">
            <p className="font-label text-[12px] font-semibold text-agave-deep">Una buena respuesta</p>
            <p className="text-[18px] font-semibold leading-[26px] text-espresso">{step.target}</p>
          </div>
          <SpeakButton lines={[{ text: step.target, who: "mushroom" }]} label="Escuchar el modelo" />
        </div>
      )}
      {revealed && step.selfCheck.length > 0 && (
        <ul className="flex flex-col gap-2">
          {step.selfCheck.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                role="checkbox"
                aria-checked={ticks[i]}
                onClick={() => setTicks((t) => t.map((x, j) => (j === i ? !x : x)))}
                className="flex min-h-12 w-full items-center gap-3 text-left text-[15px] leading-[22px] text-espresso"
              >
                <span className={`grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] ${ticks[i] ? "border-agave bg-agave text-white" : "border-sand-deep bg-white"}`}>
                  {ticks[i] && <Check className="size-4" strokeWidth={3} />}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      <BottomBar>
        {!revealed ? (
          <Primary onClick={() => setRevealed(true)}>Ya lo dije</Primary>
        ) : (
          <div className="flex gap-3">
            <button type="button" onClick={() => done(false)} className="pill flex-1 border-[1.5px] border-terra bg-white text-terra-deep active:translate-y-0.5">
              <RotateCcw className="size-4" /> Otra vez
            </button>
            <div className="flex-[1.4]"><Primary tone="agave" onClick={() => done(true)}>Me salió</Primary></div>
          </div>
        )}
      </BottomBar>
    </>
  );
}

function WriteStep({ step, onNext }: { step: Extract<Step, { kind: "write" }>; onNext: () => void }) {
  const [v, setV] = useState("");
  const [shown, setShown] = useState(false);
  return (
    <>
      <Heading>{step.prompt}</Heading>
      {step.incoming && (
        <div className="self-start rounded-[1.25rem] rounded-bl-md bg-white px-4 py-3 text-[17px] leading-[26px] text-espresso shadow-[var(--shadow-card)]">{step.incoming}</div>
      )}
      <label htmlFor="draft" className="sr-only">Tu mensaje</label>
      <textarea
        id="draft"
        value={v}
        onChange={(e) => setV(e.target.value)}
        lang="es"
        rows={5}
        placeholder="Escribe tu mensaje…"
        className="card w-full resize-none p-5 text-[17px] leading-[26px] text-espresso outline-none placeholder:text-pebble focus:border-terra"
      />
      {shown && (
        <div className="flex flex-col gap-4">
          {step.model && (
            <div className="card border-agave/25 bg-agave-wash p-5">
              <p className="font-label text-[12px] font-semibold text-agave-deep">Un modelo</p>
              <p className="mt-1 text-[17px] leading-[26px] text-espresso">{step.model}</p>
            </div>
          )}
          {step.checklist.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {step.checklist.map((c) => (
                <li key={c} className="rounded-full bg-crema-mid px-3 py-1.5 font-label text-[13px] font-semibold text-pebble">{c}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <BottomBar>
        {!shown ? (
          <Primary disabled={!v.trim()} onClick={() => { setShown(true); saveAttempt(step.id, v, true); }}>Comparar con el modelo</Primary>
        ) : (
          <Primary onClick={onNext}>Continuar <ChevronRight className="size-5" /></Primary>
        )}
      </BottomBar>
    </>
  );
}

function RateStep({ step, onNext }: { step: Extract<Step, { kind: "rate" }>; onNext: () => void }) {
  const opts = useMemo(
    () => (step.options.length ? step.options : [{ id: "easy", es: "Fácil", en: "Easy" }, { id: "ok", es: "Bien", en: "OK" }, { id: "hard", es: "Difícil", en: "Hard" }]),
    [step.options],
  );
  const [sel, setSel] = useState<string | null>(null);
  return (
    <>
      <Heading>{step.prompt}</Heading>
      <div className="flex flex-wrap gap-2.5">
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={sel === o.id}
            onClick={() => setSel(o.id)}
            className={`min-h-12 rounded-full border-[1.5px] px-5 py-2 text-left transition active:translate-y-0.5 ${
              sel === o.id ? "border-terra bg-terra-wash font-semibold text-terra-deep" : "border-[rgba(44,34,30,0.08)] bg-white text-espresso shadow-[var(--shadow-card)]"
            }`}
          >
            <span className="text-[16px]">{o.es}</span>
          </button>
        ))}
      </div>
      <BottomBar>
        <Primary disabled={!sel} onClick={() => { saveAttempt(step.id, sel!, true); onNext(); }}>Guardar</Primary>
      </BottomBar>
    </>
  );
}

/* ---------------- the check moment ---------------- */

function FeedbackSheet({ v, onContinue }: { v: NonNullable<Verdict>; onContinue: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[30rem] animate-[sheet-rise_420ms_var(--ease-out-expo)] rounded-t-[2rem] px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-5 shadow-[0_-10px_28px_rgba(44,34,30,0.10)] ${
        v.ok ? "bg-agave-soft" : "bg-[#f6e7d4]"
      }`}
    >
      <div className="flex items-start gap-3">
        <Mushroom mood={v.ok ? "excited" : v.final ? "teaching" : "oops"} size={76} className="-mt-12" />
        <div className="min-w-0 flex-1 pt-1">
          <p className={`text-[24px] font-extrabold leading-8 tracking-[-0.02em] ${v.ok ? "text-agave-deep" : "text-terra-deep"}`}>{v.title}</p>
          {v.body && <p className="mt-1 text-[16px] leading-6 text-espresso">{v.body}</p>}
        </div>
        {v.say && <SpeakButton lines={[{ text: v.say, who: "mushroom" }]} label="Escuchar la respuesta" />}
      </div>
      <div className="mt-4">
        <button
          ref={ref}
          type="button"
          onClick={onContinue}
          className={`pill w-full text-white active:translate-y-0.5 active:shadow-none ${
            v.ok ? "bg-agave-deep shadow-[inset_0_-3px_0_rgba(0,0,0,0.22)]" : "bg-terra-deep shadow-[inset_0_-3px_0_#7a2a0c]"
          }`}
        >
          {v.final ? <>Continuar <ChevronRight className="size-5" /></> : <>Intentar otra vez</>}
        </button>
      </div>
    </div>
  );
}
