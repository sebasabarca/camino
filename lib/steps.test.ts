// Run: node --test lib/steps.test.ts   (needs data/course.db from the pipeline export)
import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { buildSteps } from "./steps.ts";

const db = new Database("data/course.db", { readonly: true });

test("every pilot activity becomes at least one well-formed step", () => {
  const acts = db.prepare("SELECT id, unit_id, type, response_type, data FROM activities").all() as
    { id: string; unit_id: string; type: string; response_type: string; data: string }[];
  const kinds: Record<string, number> = {};
  for (const a of acts) {
    const data = JSON.parse(a.data);
    const checkItems = a.type === "unit_check"
      ? (db.prepare("SELECT id, skill, data FROM check_items WHERE check_id = ? ORDER BY ord").all(data.assessment_ref) as { id: string; skill: string; data: string }[])
          .map((c) => ({ ...c, data: JSON.parse(c.data) }))
      : [];
    const steps = buildSteps({ ...a, data }, {}, [{ id: "x", spanish: "hola", gloss: "hi" }], checkItems);
    assert.ok(steps.length > 0, `${a.id} has no steps`);
    for (const s of steps) {
      assert.ok(s.id, `${a.id}: step without id`);
      kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;
      if (s.kind === "choice") assert.ok(s.choices.includes(s.answer), `${s.id}: answer not among choices`);
      if (s.kind === "type") assert.ok(s.keys.length > 0, `${s.id}: no keys`);
    }
  }
  console.log(acts.length, "activities →", kinds);
});
