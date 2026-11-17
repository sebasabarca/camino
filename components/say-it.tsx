"use client";
import { useEffect, useState } from "react";
import { Play, Snail, Volume2 } from "lucide-react";
import { prefersSlow, setPrefersSlow, speak } from "@/lib/speech";

export function SayIt({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => speak([{ text }])}
      aria-label={`Escuchar: ${text}`}
      className="grid size-12 shrink-0 place-items-center rounded-full bg-terra-wash text-terra-deep transition active:scale-95"
    >
      <Volume2 className="size-5" strokeWidth={2.25} />
    </button>
  );
}

/** A phrase row: tapping anywhere on it plays the phrase; the speaker shows that it can. */
export function SayRow({ spanish, gloss }: { spanish: string; gloss?: string }) {
  return (
    <button type="button" onClick={() => speak([{ text: spanish }])} className="flex w-full items-center gap-3 py-3.5 text-left active:opacity-70">
      <span className="min-w-0 flex-1">
        <span lang="es" className="block text-[17px] font-semibold leading-6 text-espresso">{spanish}</span>
        {gloss && <span className="block text-[14px] leading-5 text-pebble">{gloss}</span>}
      </span>
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-terra-wash text-terra-deep">
        <Volume2 className="size-5" strokeWidth={2.25} />
      </span>
    </button>
  );
}

/** Plays a whole group of phrases in a row, a short pause apart (the period gives the voice its breath). */
export function SayAll({ texts, label }: { texts: string[]; label: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(texts.map((t) => ({ text: /[.!?]$/.test(t) ? t : `${t}.` })))}
      aria-label={label}
      className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 font-label text-[14px] font-semibold text-terra-deep active:bg-terra-wash"
    >
      <Play className="size-4" fill="currentColor" strokeWidth={0} /> Todas
    </button>
  );
}

/** The voice-speed preference on the Yo tab; every speaker in the app reads it. */
export function SpeedSetting() {
  const [slow, setSlow] = useState(false);
  useEffect(() => setSlow(prefersSlow()), []);
  const choose = (s: boolean) => {
    setSlow(s);
    setPrefersSlow(s);
    speak([{ text: s ? "Así, más despacio." : "Así, a velocidad normal." }], { slow: s });
  };
  return (
    <div className="flex rounded-full bg-crema-mid p-1 font-label text-[14px] font-semibold" role="radiogroup" aria-label="Velocidad de la voz">
      {[false, true].map((s) => (
        <button
          key={String(s)}
          type="button"
          role="radio"
          aria-checked={slow === s}
          onClick={() => choose(s)}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 ${slow === s ? "bg-white text-terra-deep shadow-[var(--shadow-press)]" : "text-pebble"}`}
        >
          {s ? <><Snail className="size-4" /> Despacio</> : "Normal"}
        </button>
      ))}
    </div>
  );
}
