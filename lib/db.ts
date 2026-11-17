// Server-only data access. Two SQLite files:
//   data/course.db   read-only course content, rebuilt by `python3 tools/export_db.py` in ../pipeline
//   data/progress.db learner progress, owned by the app; never touched by an export
// Rows are small (one activity ≈ 1–6 KB of JSON), so pages load only what they show.
import "server-only";
import Database from "better-sqlite3";
import path from "node:path";

const DATA = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

type DB = Database.Database;
const g = globalThis as unknown as { courseDb?: DB; progressDb?: DB };

function course(): DB {
  // fileMustExist: fail loudly if the export hasn't been run, instead of creating an empty file
  g.courseDb ??= new Database(path.join(DATA, "course.db"), { readonly: true, fileMustExist: true });
  return g.courseDb;
}

function progress(): DB {
  if (!g.progressDb) {
    const db = new Database(path.join(DATA, "progress.db"));
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS learners (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS attempts (  -- every answer she submits, kept for feedback and review
        id INTEGER PRIMARY KEY AUTOINCREMENT, learner_id TEXT NOT NULL REFERENCES learners(id),
        target_id TEXT NOT NULL,            -- activity, cue, question or check-item id
        answer TEXT, correct INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));
      CREATE TABLE IF NOT EXISTS progress (  -- latest state per activity
        learner_id TEXT NOT NULL REFERENCES learners(id), activity_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('started','completed')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (learner_id, activity_id));
      CREATE INDEX IF NOT EXISTS attempts_learner ON attempts(learner_id, target_id);
    `);
    g.progressDb = db;
  }
  return g.progressDb;
}

const parse = <T>(s: string | null): T | null => (s == null ? null : (JSON.parse(s) as T));

// ---------- content ----------
export type UnitRow = { id: string; ord: number; phase: string; title: string; goal: string; status: string; pilot: number };
export type SessionRow = { id: string; unit_id: string; ord: number; title: string; objective: string; minutes: number };
export type ActivityRow = {
  id: string; session_id: string; ord: number; type: string; mode: string; step: string;
  minutes: number; response_type: string; audio_ref: string | null;
};
export type Activity = ActivityRow & { data: Record<string, unknown> };

export function listUnits(opts: { pilotOnly?: boolean } = {}): UnitRow[] {
  return course()
    .prepare(`SELECT id, ord, phase, title, goal, status, pilot FROM units ${opts.pilotOnly ? "WHERE pilot = 1" : ""} ORDER BY ord`)
    .all() as UnitRow[];
}

/** A unit's outline: sessions and activity headers, without activity payloads. */
export function getUnitOutline(unitId: string) {
  const db = course();
  const unit = db.prepare(`SELECT id, ord, phase, title, goal, status, pilot FROM units WHERE id = ?`).get(unitId) as UnitRow | undefined;
  if (!unit) return null;
  const sessions = db.prepare(`SELECT id, unit_id, ord, title, objective, minutes FROM sessions WHERE unit_id = ? ORDER BY ord`).all(unitId) as SessionRow[];
  const acts = db.prepare(
    `SELECT id, session_id, ord, type, mode, step, minutes, response_type, audio_ref FROM activities WHERE unit_id = ? ORDER BY ord`,
  ).all(unitId) as ActivityRow[];
  return { unit, sessions: sessions.map((s) => ({ ...s, activities: acts.filter((a) => a.session_id === s.id) })) };
}

/** One activity with its full payload (dialogue, questions, cues, answer keys…). */
export function getActivity(activityId: string): Activity | null {
  const row = course().prepare(`SELECT * FROM activities WHERE id = ?`).get(activityId) as (ActivityRow & { data: string }) | undefined;
  return row ? { ...row, data: parse<Record<string, unknown>>(row.data) ?? {} } : null;
}

export function getSpeakers(unitId: string, scope: "unit" | "check" | "delayed" = "unit") {
  return course().prepare(`SELECT id, name, voice, role FROM speakers WHERE unit_id = ? AND scope = ?`).all(unitId, scope) as
    { id: string; name: string; voice: string | null; role: string | null }[];
}

export function getUnitItems(unitId: string) {
  return course().prepare(
    `SELECT i.id, i.kind, i.spanish, i.gloss, ui.stage FROM unit_items ui JOIN items i ON i.id = ui.item_id
     WHERE ui.unit_id = ? ORDER BY ui.ord`,
  ).all(unitId) as { id: string; kind: string; spanish: string; gloss: string; stage: string }[];
}

// ---------- progress ----------
export function ensureLearner(id: string, name: string) {
  progress().prepare(`INSERT OR IGNORE INTO learners (id, name) VALUES (?, ?)`).run(id, name);
}

export function recordAttempt(learnerId: string, targetId: string, answer: string, correct: boolean) {
  progress().prepare(`INSERT INTO attempts (learner_id, target_id, answer, correct) VALUES (?, ?, ?, ?)`)
    .run(learnerId, targetId, answer, correct ? 1 : 0);
}

export function setProgress(learnerId: string, activityId: string, status: "started" | "completed") {
  progress().prepare(
    `INSERT INTO progress (learner_id, activity_id, status) VALUES (?, ?, ?)
     ON CONFLICT (learner_id, activity_id) DO UPDATE SET status = excluded.status, updated_at = datetime('now')`,
  ).run(learnerId, activityId, status);
}

export function getProgress(learnerId: string) {
  return progress().prepare(`SELECT activity_id, status, updated_at FROM progress WHERE learner_id = ?`).all(learnerId) as
    { activity_id: string; status: string; updated_at: string }[];
}
