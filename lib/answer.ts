// Answer checking. Lenient on accents, case, spacing and punctuation ("Que hora es" = "¿Qué hora es?"),
// but ñ stays distinct from n (año ≠ ano). Placeholders in keys ("[número]", "[edad]", "...") match any words.

const PUNCT = /[¿?¡!.,;:"“”'‘’«»()…—–-]/g;

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ñ/g, "\u0000") // protect ñ from accent folding
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\u0000/g, "ñ")
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
