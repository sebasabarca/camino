// Answer checking. Lenient on accents, case, spacing and punctuation ("Que hora es" = "¿Qué hora es?").
// Since 2026-11-19 n is also accepted for ñ (the owner's call: an English keyboard has no ñ key); `enye()` lets the
// player point out the spelling. Placeholders in keys ("[número]", "[edad]", "...") match any words.

const PUNCT = /[¿?¡!.,;:"“”'‘’«»()…—–-]/g;

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // drops accents and the tilde of ñ
    .replace(/\[[^\]]*\]|\.\.\.|…/g, " \u0001 ") // placeholder marker survives punctuation stripping
    .replace(PUNCT, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toPattern(key: string): RegExp | null {
  const n = normalize(key);
  if (!n.includes("\u0001")) return null;
  const parts = n.split("\u0001").map((p) => p.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^${parts.join(".+?").replace(/\s+/g, "\\s*")}$`.replace(/\\s\*\.\+\?/g, "\\s*.+?"));
}

export function matches(answer: string, keys: string[]): boolean {
  const a = normalize(answer);
  if (!a) return false;
  return keys.some((k) => {
    const p = toPattern(k);
    return p ? p.test(a) : normalize(k) === a;
  });
}

// ---------- letter-level comparison, for "almost" answers ----------
// Compares letters the same lenient way as matches() (case, accents and ñ folded), so a missing accent is
// never marked as a mistake.

export type Seg = { text: string; off: boolean };

const fold = (c: string) => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const skip = (c: string) => /[\s¿?¡!.,;:"“”'‘’«»()…—–-]/.test(c);

/** Marks the letters of `a` that are not part of the longest common letter sequence with `b`. */
function marks(a: string, b: string): boolean[] {
  const A = [...a], B = [...b];
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = fold(A[i]) === fold(B[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const keep = new Array<boolean>(n).fill(false);
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (fold(A[i]) === fold(B[j])) { keep[i] = true; i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return A.map((c, i) => !keep[i] && !skip(c));
}

function segs(a: string, off: boolean[]): Seg[] {
  const out: Seg[] = [];
  [...a].forEach((c, i) => {
    const last = out[out.length - 1];
    if (last && last.off === off[i]) last.text += c;
    else out.push({ text: c, off: off[i] });
  });
  return out;
}

/** How close two answers are, 0..1, ignoring case, accents and punctuation. */
export function similarity(a: string, b: string): number {
  const x = normalize(a), y = normalize(b);
  if (!x || !y) return 0;
  const off = marks(x, y).filter(Boolean).length + marks(y, x).filter(Boolean).length;
  return 1 - off / (x.replace(/ /g, "").length + y.replace(/ /g, "").length);
}

/** The accepted key closest to her answer (placeholder keys are skipped: they can't be compared letter by letter). */
export function closest(answer: string, keys: string[]): string | null {
  let best: string | null = null, score = 0;
  for (const k of keys) {
    if (/\[[^\]]*\]|\.\.\.|…/.test(k)) continue;
    const s = similarity(answer, k);
    if (s > score) { best = k; score = s; }
  }
  return best;
}

/** For a near miss: her answer with the wrong letters marked, and the right answer with the letters she missed marked.
 *  Null when the answers are too different for letter marks to help. */
export function letterDiff(answer: string, keys: string[]): { mine: Seg[]; right: Seg[] } | null {
  const k = closest(answer, keys);
  if (!k || similarity(answer, k) < 0.5) return null;
  const a = answer.trim();
  return { mine: segs(a, marks(a, k)), right: segs(k, marks(k, a)) };
}

/** The right spelling when her accepted answer wrote n where the answer has ñ ("ano" for "año"), else null. */
export function enye(answer: string, keys: string[]): string | null {
  const k = closest(answer, keys);
  if (!k || !/ñ/i.test(k)) return null;
  const words = (t: string) => t.toLowerCase().normalize("NFC").split(/[^a-záéíóúüñ]+/).filter(Boolean);
  const mine = new Set(words(answer));
  const missed = words(k).filter((w) => w.includes("ñ") && !mine.has(w) && mine.has(w.replace(/ñ/g, "n")));
  return missed.length ? missed.join(", ") : null;
}
