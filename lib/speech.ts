"use client";
// Free reader: the browser's built-in speech (Web Speech API). Works offline on iPhone and Mac with the
// system's Spanish voices. Each character keeps one voice for the whole session; Mushroom always gets the first.

let voices: SpeechSynthesisVoice[] = [];
const cast = new Map<string, SpeechSynthesisVoice>();

function load() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const es = speechSynthesis.getVoices().filter((v) => /^es/i.test(v.lang));
  // Latin American voices first; Spain's after. Skip novelty voices that read Spanish badly.
  const novelty = /grandma|grandpa|rocko|shelley|sandy|reed|eddy|flo/i;
  const good = es.filter((v) => !novelty.test(v.name));
  const pool = good.length ? good : es;
  voices = [...pool.filter((v) => !/es-ES/i.test(v.lang)), ...pool.filter((v) => /es-ES/i.test(v.lang))];
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  load();
  speechSynthesis.addEventListener?.("voiceschanged", load);
}

function voiceFor(who: string) {
  if (!voices.length) load();
  if (!voices.length) return undefined;
  if (!cast.has(who)) cast.set(who, voices[cast.size % voices.length]);
  return cast.get(who);
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

// Her default speed (set on the Yo tab). Per-device convenience only, so localStorage is enough.
export function prefersSlow() {
  try { return localStorage.getItem("voice-speed") === "slow"; } catch { return false; }
}
export function setPrefersSlow(slow: boolean) {
  try { localStorage.setItem("voice-speed", slow ? "slow" : "normal"); } catch { /* private mode: keep default */ }
}

export function speak(lines: { text: string; who?: string }[], opts: { slow?: boolean; onEnd?: () => void } = {}) {
  if (!canSpeak()) return opts.onEnd?.();
  speechSynthesis.cancel();
  lines.forEach((l, i) => {
    const u = new SpeechSynthesisUtterance(l.text);
    const v = voiceFor(l.who ?? "mushroom");
    u.lang = v?.lang ?? "es-MX";
    if (v) u.voice = v;
    u.rate = (opts.slow ?? prefersSlow()) ? 0.72 : 0.95;
    if (i === lines.length - 1 && opts.onEnd) u.onend = opts.onEnd;
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
}
