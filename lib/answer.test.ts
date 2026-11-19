// Run: node --test lib/answer.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { matches } from "./answer.ts";

test("accents, case and punctuation are forgiven", () => {
  assert.ok(matches("que hora es", ["¿Qué hora es?"]));
  assert.ok(matches("  Para mi, un te ", ["Para mí, un té"]));
  assert.ok(matches("GRACIAS", ["gracias"]));
});

test("n is accepted for ñ, and enye() names the word to spell with ñ", async () => {
  const { enye } = await import("./answer.ts");
  assert.ok(matches("manana", ["mañana"]));
  assert.ok(matches("Tengo veinte años", ["Tengo [edad] años."]));
  assert.ok(matches("Tengo veinte anos", ["Tengo [edad] años."]));
  assert.equal(enye("Nos vemos manana", ["Nos vemos mañana."]), "mañana");
  assert.equal(enye("Nos vemos mañana", ["Nos vemos mañana."]), null);
  assert.equal(enye("Me llamo Serena", ["Me llamo Serena."]), null);
});

test("placeholders match any words, but not nothing", () => {
  assert.ok(matches("Hoy tengo tres clases", ["Hoy tengo [número] clases."]));
  assert.ok(matches("Me levanto a las siete y media", ["Me levanto a las ..."]));
  assert.ok(!matches("Me levanto a las", ["Me levanto a las ..."]));
});

test("wrong answers and empty input fail", () => {
  assert.ok(!matches("por favor", ["gracias"]));
  assert.ok(!matches("   ", ["gracias"]));
});

test("letterDiff marks only real letter mistakes", async () => {
  const { letterDiff } = await import("./answer.ts");
  const show = (s: { text: string; off: boolean }[]) => s.map((x) => (x.off ? `[${x.text}]` : x.text)).join("");
  const d = letterDiff("tiengo", ["tengo"])!;
  assert.equal(show(d.mine), "t[i]engo");
  assert.equal(show(d.right), "tengo");
  assert.equal(show(letterDiff("me llamo serna", ["Me llamo Serena."])!.right), "Me llamo Ser[e]na.");
  // accents and punctuation are never marked
  assert.equal(show(letterDiff("Que hora es", ["¿Qué hora es?"])!.mine), "Que hora es");
  // n for ñ is accepted, so it is not marked
  assert.equal(show(letterDiff("ano", ["año"])!.right), "año");
  // too different: no marks
  assert.equal(letterDiff("hola", ["Nos vemos mañana"]), null);
  // placeholder keys are skipped
  assert.equal(letterDiff("tengo veinte años", ["Tengo [edad] años"]), null);
});
