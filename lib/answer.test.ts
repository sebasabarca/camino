// Run: node --test lib/answer.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { matches, normalize } from "./answer.ts";

test("accents, case and punctuation are forgiven", () => {
  assert.ok(matches("que hora es", ["¿Qué hora es?"]));
  assert.ok(matches("  Para mi, un te ", ["Para mí, un té"]));
  assert.ok(matches("GRACIAS", ["gracias"]));
});

test("ñ stays distinct from n", () => {
  assert.equal(normalize("Mañana"), "mañana");
  assert.ok(!matches("manana", ["mañana"]));
  assert.ok(matches("Tengo veinte años", ["Tengo [edad] años."]));
  assert.ok(!matches("Tengo veinte anos", ["Tengo [edad] años."]));
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
