// Run: node --test lib/steps.test.ts   (needs data/course.db from the pipeline export)
import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

const db = new Database(process.env.COURSE_DB ?? "data/course.db", { readonly: true });

test("every lesson-format activity becomes teach cards, then well-formed exercises", async () => {
  const { lessonSteps } = await import("./lesson-steps.ts");
  const { matches } = await import("./answer.ts");
  const acts = db.prepare("SELECT a.id, a.data FROM activities a JOIN units u ON u.id = a.unit_id WHERE u.format = 'lessons' AND a.type = 'lesson'").all() as
    { id: string; data: string }[];
  const kinds: Record<string, number> = {};
  for (const a of acts) {
    const data = JSON.parse(a.data);
    const steps = lessonSteps(a.id, data);
    const exercises = (data.exercises ?? []).length;
    assert.equal(steps.filter((s) => s.kind !== "teach").length, exercises, `${a.id}: an exercise was dropped`);
    const firstQuiz = steps.findIndex((s) => s.kind !== "teach");
    assert.ok(steps.slice(firstQuiz).every((s) => s.kind !== "teach"), `${a.id}: teach card after the quiz started`);
    for (const s of steps) {
      kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;
      if (s.kind === "pick") assert.ok(s.choices.includes(s.answer), `${s.id}: answer not among choices`);
      if (s.kind === "fill") assert.ok(matches(s.answer, s.keys), `${s.id}: own answer rejected`);
      // the answer must be buildable from the tile bank, and the checker must accept it
      if (s.kind === "tiles") {
        const bank = [...s.bank];
        const built = s.answer.split(/\s+/).map((w) => w.replace(/[¿?¡!.,;:"“”]/g, "")).filter(Boolean);
        for (const w of built) {
          const i = bank.indexOf(w);
          assert.ok(i >= 0, `${s.id}: tile “${w}” missing`);
          bank.splice(i, 1);
        }
        assert.ok(matches(built.join(" "), s.keys), `${s.id}: tiles answer rejected by the checker`);
      }
    }
  }
  console.log(acts.length, "lessons →", kinds);
});

test("every lesson-format unit check becomes exercises, one per item", async () => {
  const { checkSteps } = await import("./lesson-steps.ts");
  const checks = db.prepare("SELECT c.id FROM checks c JOIN units u ON u.id = c.unit_id WHERE u.format = 'lessons'").all() as { id: string }[];
  for (const c of checks) {
    const items = (db.prepare("SELECT id, data FROM check_items WHERE check_id = ? ORDER BY ord").all(c.id) as { id: string; data: string }[])
      .map((r) => ({ id: r.id, data: JSON.parse(r.data) }));
    assert.equal(checkSteps(items).length, items.length, `${c.id}: an item was dropped`);
  }
});

test("every delayed unit check becomes exercises, one per item", async () => {
  const { checkSteps } = await import("./lesson-steps.ts");
  const checks = db.prepare("SELECT c.id FROM checks c JOIN units u ON u.id = c.unit_id WHERE c.kind = 'delayed' AND u.format = 'lessons'").all() as { id: string }[];
  assert.ok(checks.length > 0, "no delayed checks exported");
  for (const c of checks) {
    const items = (db.prepare("SELECT id, data FROM check_items WHERE check_id = ? ORDER BY ord").all(c.id) as { id: string; data: string }[])
      .map((r) => ({ id: r.id, data: JSON.parse(r.data) }));
    const steps = checkSteps(items);
    assert.equal(steps.length, items.length, `${c.id}: some items did not become exercises`);
  }
});
