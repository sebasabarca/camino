"use client";
// Shared lesson UI: the bottom action bar, the main pill, headings, the speaker button and the feedback sheet.
import { useEffect, useRef } from "react";
import { ChevronRight, Volume2 } from "lucide-react";
import { prefersSlow, speak } from "@/lib/speech";
import { Mushroom } from "./mushroom";

type Line = { text: string; who?: string };

export type Verdict = {
  ok: boolean; title: string; body?: string; say?: string; final: boolean;
  diff?: { label: string; segs: { text: string; off: boolean }[] };
} | null;


export const PRAISE = ["¡Excelente!", "¡Muy bien!", "¡Eso es!", "¡Perfecto!", "¡Bien dicho!"];
export const pick = (xs: string[], seed: string) => xs[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % xs.length];

export function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[30rem] bg-gradient-to-t from-crema from-70% to-transparent px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-8">
      {children}
    </div>
  );
}

export function Primary({ children, disabled, onClick, tone = "terra" }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void; tone?: "terra" | "agave" }) {
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

export function SpeakButton({ lines, label = "Escuchar" }: { lines: Line[]; label?: string }) {
  return (
    <button type="button" onClick={() => speak(lines, { slow: prefersSlow() })} aria-label={label} className="grid size-12 shrink-0 place-items-center rounded-full bg-terra-wash text-terra-deep transition active:scale-95">
      <Volume2 className="size-5" strokeWidth={2.25} />
    </button>
  );
}

/** Every exercise opens the same way: what to do (the heading), then where she is and how to answer. */
export function TaskHead({ title, sub, extra }: { title: string; sub?: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-balance text-[24px] font-bold leading-8 tracking-[-0.015em] text-espresso">{title}</h1>
        {sub && <p className="mt-1 font-label text-[14px] font-semibold leading-5 text-pebble">{sub}</p>}
      </div>
      {extra}
    </div>
  );
}


export function FeedbackSheet({ v, onContinue }: { v: NonNullable<Verdict>; onContinue: () => void }) {
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
          {v.diff && (
            <p className="mt-1 text-[16px] leading-6 text-espresso">
              <span className="text-pebble">{v.diff.label}: </span>
              <span className="text-[19px] font-bold">
                {v.diff.segs.map((s, i) =>
                  s.off ? (
                    <mark key={i} className="rounded-[0.3rem] bg-terra-wash px-0.5 text-terra-deep underline decoration-terra decoration-2 underline-offset-4">{s.text}</mark>
                  ) : (
                    <span key={i}>{s.text}</span>
                  ),
                )}
              </span>
            </p>
          )}
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

