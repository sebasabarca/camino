// Server-only data access. Two SQLite files:
//   data/course.db             read-only course content, committed with the app (built by the course pipeline's export)
//   $DATA_DIR/progress.db      learner progress, owned by the app; never touched by an export
// DATA_DIR (default ./data) holds only progress and its backups, so a server can keep it on a persistent disk
// outside the code checkout while course.db updates with each `git pull`.
// Rows are small (one activity ≈ 1–6 KB of JSON), so pages load only what they show.
import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const COURSE_DB = process.env.COURSE_DB ?? path.join(process.cwd(), "data", "course.db");

type DB = Database.Database;
const g = globalThis as unknown as { courseDb?: DB; progressDb?: DB };

function course(): DB {
  // fileMustExist: fail loudly if the export hasn't been run, instead of creating an empty file
  g.courseDb ??= new Database(COURSE_DB, { readonly: true, fileMustExist: true });
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
      CREATE TABLE IF NOT EXISTS lesson_state (  -- where she is inside an unfinished lesson, so she can resume
        learner_id TEXT NOT NULL REFERENCES learners(id), activity_id TEXT NOT NULL,
        sig TEXT NOT NULL,                  -- the lesson's step ids at save time; a re-exported lesson starts fresh
        state TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (learner_id, activity_id));
      CREATE TABLE IF NOT EXISTS reports (  -- "Algo está mal": kept for good; fixed ones are listed in course.db fixes
        id INTEGER PRIMARY KEY AUTOINCREMENT, learner_id TEXT NOT NULL REFERENCES learners(id),
        target_id TEXT NOT NULL,            -- exercise, teach card or check item id
        activity_id TEXT, reason TEXT NOT NULL, note TEXT, answer TEXT,
        snapshot TEXT,                      -- the step as she saw it (JSON), since content changes after a fix
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','dismissed')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        fix_seen_at TEXT);                  -- when she was shown the fix
      CREATE TABLE IF NOT EXISTS review (  -- spaced review per exercise (Leitner boxes); no row = never missed
        learner_id TEXT NOT NULL REFERENCES learners(id), target_id TEXT NOT NULL,
        box INTEGER NOT NULL, due_at TEXT NOT NULL, misses INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (learner_id, target_id));
    `);
    g.progressDb = db;
  }
  backupDaily(g.progressDb);
  return g.progressDb;
}

// ---------- backups ----------
// One copy of progress.db a day in DATA_DIR/backups (progress-YYYY-MM-DD.db), newest 30 kept. Taken with SQLite's
// online backup, so it is safe while the app is running. Copy the folder off the server now and then: a backup on
// the same disk does not survive the disk.
export const BACKUPS = path.join(DATA, "backups");
const KEEP = 30;
const b = globalThis as unknown as { backupDay?: string };

function backupDaily(db: DB) {
  const day = new Date().toISOString().slice(0, 10);
  if (b.backupDay === day) return;
  b.backupDay = day; // once per process per day, even if the copy fails (no retry storm)
  const dest = path.join(BACKUPS, `progress-${day}.db`);
  try {
    fs.mkdirSync(BACKUPS, { recursive: true });
    if (fs.existsSync(dest)) return;
    db.backup(dest)
      .then(() => {
        const old = listBackups().slice(KEEP);
        for (const f of old) fs.rmSync(path.join(BACKUPS, f.name));
      })
      .catch((e) => console.error("progress backup failed:", e));
  } catch (e) {
    console.error("progress backup failed:", e);
  }
}

/** Backups, newest first. */
export function listBackups() {
  if (!fs.existsSync(BACKUPS)) return [];
  return fs.readdirSync(BACKUPS)
    .filter((f) => /^progress-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .reverse()
    .map((name) => ({ name, bytes: fs.statSync(path.join(BACKUPS, name)).size }));
}

const parse = <T>(s: string | null): T | null => (s == null ? null : (JSON.parse(s) as T));

// ---------- content ----------
export type UnitRow = { id: string; ord: number; phase: string; title: string; goal: string; status: string; pilot: number; format: "sessions" | "lessons" };
export type SessionRow = { id: string; unit_id: string; ord: number; title: string; objective: string; minutes: number };
export type ActivityRow = {
  id: string; session_id: string; ord: number; type: string; mode: string; step: string;
  minutes: number; response_type: string; audio_ref: string | null;
};
export type Activity = ActivityRow & { data: Record<string, unknown> };

export function listUnits(opts: { pilotOnly?: boolean } = {}): UnitRow[] {
  return course()
    .prepare(`SELECT id, ord, phase, title, goal, status, pilot, format FROM units ${opts.pilotOnly ? "WHERE pilot = 1" : ""} ORDER BY ord`)
    .all() as UnitRow[];
}

/** A unit's outline: sessions and activity headers, without activity payloads. */
export function getUnitOutline(unitId: string) {
  const db = course();
  const unit = db.prepare(`SELECT id, ord, phase, title, goal, status, pilot, format FROM units WHERE id = ?`).get(unitId) as UnitRow | undefined;
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

export type CheckItem = { id: string; skill: string; audio_ref: string | null; data: Record<string, unknown> };

/** The export schema this app reads (pipeline/tools/export_db.py SCHEMA_VERSION). */
export const SCHEMA_VERSION = 3;
export function checkSchema() {
  const row = course().prepare(`SELECT value FROM meta WHERE key = 'schema_version'`).get() as { value: string } | undefined;
  if (Number(row?.value) !== SCHEMA_VERSION)
    throw new Error(`course.db has export schema ${row?.value ?? "?"}, the app needs ${SCHEMA_VERSION}: re-export it with the course pipeline (python3 tools/export_db.py)`);
}

/** Everything the lesson player needs for one activity, and nothing more. */
export function getLessonContext(activityId: string) {
  const db = course();
  const activity = getActivity(activityId);
  if (!activity) return null;
  const session = db.prepare(`SELECT id, unit_id, ord, title, objective, minutes FROM sessions WHERE id = ?`).get(activity.session_id) as SessionRow;
  const unit = db.prepare(`SELECT id, ord, phase, title, goal, status, pilot, format FROM units WHERE id = ?`).get(session.unit_id) as UnitRow;
  const siblings = db.prepare(`SELECT id FROM activities WHERE session_id = ? ORDER BY ord`).all(session.id) as { id: string }[];
  let checkItems: CheckItem[] = [];
  const ref = activity.data.assessment_ref as string | undefined;
  if (activity.type === "unit_check" && ref) {
    checkItems = (db.prepare(`SELECT id, skill, audio_ref, data FROM check_items WHERE check_id = ? ORDER BY ord`).all(ref) as
      (Omit<CheckItem, "data"> & { data: string })[]).map((r) => ({ ...r, data: parse<Record<string, unknown>>(r.data) ?? {} }));
  }
  const index = siblings.findIndex((s) => s.id === activityId);
  return { activity, session, unit, checkItems, index, total: siblings.length, nextId: siblings[index + 1]?.id ?? null };
}

/** The words a session practises (union of its activities' input_refs), in first-use order. */
export function getSessionItems(sessionId: string) {
  const db = course();
  const ids: string[] = [];
  for (const r of db.prepare(`SELECT data FROM activities WHERE session_id = ? ORDER BY ord`).all(sessionId) as { data: string }[])
    for (const id of (JSON.parse(r.data).input_refs as string[] | undefined) ?? []) if (!ids.includes(id)) ids.push(id);
  if (!ids.length) return [];
  const rows = db.prepare(`SELECT id, spanish, gloss FROM items WHERE id IN (${ids.map(() => "?").join(",")})`).all(...ids) as
    { id: string; spanish: string; gloss: string }[];
  return ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean) as typeof rows;
}

export function getSession(sessionId: string) {
  return course().prepare(`SELECT id, unit_id, ord, title, objective, minutes FROM sessions WHERE id = ?`).get(sessionId) as SessionRow | undefined;
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

/** Completed activity ids for a learner. */
export function completedSet(learnerId: string) {
  return new Set(
    (progress().prepare(`SELECT activity_id FROM progress WHERE learner_id = ? AND status = 'completed'`).all(learnerId) as { activity_id: string }[])
      .map((r) => r.activity_id),
  );
}

export function getProgress(learnerId: string) {
  return progress().prepare(`SELECT activity_id, status, updated_at FROM progress WHERE learner_id = ?`).all(learnerId) as
    { activity_id: string; status: string; updated_at: string }[];
}

// ---------- resume inside a lesson ----------
export type SavedLesson = { queue: number[]; at: number; first: [string, boolean][] };

export function getLessonState(learnerId: string, activityId: string, sig: string): SavedLesson | null {
  const row = progress().prepare(`SELECT sig, state FROM lesson_state WHERE learner_id = ? AND activity_id = ?`).get(learnerId, activityId) as
    { sig: string; state: string } | undefined;
  return row && row.sig === sig ? parse<SavedLesson>(row.state) : null;
}

export function putLessonState(learnerId: string, activityId: string, sig: string, state: SavedLesson) {
  progress().prepare(
    `INSERT INTO lesson_state (learner_id, activity_id, sig, state) VALUES (?, ?, ?, ?)
     ON CONFLICT (learner_id, activity_id) DO UPDATE SET sig = excluded.sig, state = excluded.state, updated_at = datetime('now')`,
  ).run(learnerId, activityId, sig, JSON.stringify(state));
}

export function clearLessonState(learnerId: string, activityId: string) {
  progress().prepare(`DELETE FROM lesson_state WHERE learner_id = ? AND activity_id = ?`).run(learnerId, activityId);
}

// ---------- spaced review ----------
/** Days until the next review, by box. Box 0 = missed: due straight away. */
export const INTERVALS = [0, 1, 3, 7, 14, 30];
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

export type ReviewRow = { target_id: string; box: number; due_at: string; misses: number };

export function getReviews(learnerId: string): Map<string, ReviewRow> {
  const rows = progress().prepare(`SELECT target_id, box, due_at, misses FROM review WHERE learner_id = ?`).all(learnerId) as ReviewRow[];
  return new Map(rows.map((r) => [r.target_id, r]));
}

/** First try in a lesson: a miss puts the exercise in box 0 (due now). A first-try success needs no row. */
export function reviewAfterLesson(learnerId: string, targetId: string, ok: boolean) {
  if (ok) return;
  progress().prepare(
    `INSERT INTO review (learner_id, target_id, box, due_at, misses) VALUES (?, ?, 0, ?, 1)
     ON CONFLICT (learner_id, target_id) DO UPDATE SET box = 0, due_at = excluded.due_at, misses = misses + 1, updated_at = datetime('now')`,
  ).run(learnerId, targetId, iso(Date.now()));
}

/** First try in practice: right moves it up a box (seen again later), wrong sends it back to box 0. */
export function reviewAfterPractice(learnerId: string, targetId: string, ok: boolean) {
  const cur = getReviews(learnerId).get(targetId);
  const box = ok ? Math.min((cur?.box ?? 1) + 1, INTERVALS.length - 1) : 0;
  progress().prepare(
    `INSERT INTO review (learner_id, target_id, box, due_at, misses) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (learner_id, target_id) DO UPDATE SET box = excluded.box, due_at = excluded.due_at,
       misses = misses + excluded.misses, updated_at = datetime('now')`,
  ).run(learnerId, targetId, box, iso(Date.now() + INTERVALS[box] * DAY), ok ? 0 : 1);
}

/** Lesson activities she has finished, with their payloads and when she finished them. */
export function completedLessons(learnerId: string) {
  const done = progress().prepare(`SELECT activity_id, updated_at FROM progress WHERE learner_id = ? AND status = 'completed'`).all(learnerId) as
    { activity_id: string; updated_at: string }[];
  if (!done.length) return [];
  const when = new Map(done.map((d) => [d.activity_id, d.updated_at]));
  const rows = course().prepare(
    `SELECT a.id, a.unit_id, a.data FROM activities a JOIN units u ON u.id = a.unit_id
     WHERE a.type = 'lesson' AND a.id IN (${done.map(() => "?").join(",")}) ORDER BY u.ord, a.ord`,
  ).all(...done.map((d) => d.activity_id)) as { id: string; unit_id: string; data: string }[];
  // progress timestamps are SQLite UTC ("YYYY-MM-DD HH:MM:SS")
  return rows.map((r) => ({ id: r.id, unitId: r.unit_id, data: parse<Record<string, unknown>>(r.data) ?? {}, doneAt: Date.parse(when.get(r.id)!.replace(" ", "T") + "Z") }));
}

/** Every lesson activity in course order (for the teach-card and word-meaning lookups). */
export function allLessons() {
  return (course().prepare(
    `SELECT a.id, a.unit_id, a.data FROM activities a JOIN units u ON u.id = a.unit_id JOIN sessions s ON s.id = a.session_id
     WHERE a.type = 'lesson' ORDER BY u.ord, s.ord, a.ord`,
  ).all() as { id: string; unit_id: string; data: string }[]).map((r) => ({ ...r, data: parse<Record<string, unknown>>(r.data) ?? {} }));
}

export function allItems() {
  return course().prepare(`SELECT id, spanish FROM items`).all() as { id: string; spanish: string | null }[];
}

// ---------- delayed unit checks ----------
export type DelayedCheck = { id: string; unit_id: string; minutes: number | null; release_after_days: number | null; pass_rule: string | null };

/** Delayed checks (one per unit, `<unit>-check-d`), released some weeks after the unit check. */
export function delayedChecks(): DelayedCheck[] {
  return (course().prepare(`SELECT id, unit_id, minutes, release_after_days, data FROM checks WHERE kind = 'delayed'`).all() as
    (Omit<DelayedCheck, "pass_rule"> & { data: string })[]).map(({ data, ...r }) => ({ ...r, pass_rule: (parse<{ pass_rule?: string }>(data)?.pass_rule) ?? null }));
}

export function getCheckItems(checkId: string): CheckItem[] {
  return (course().prepare(`SELECT id, skill, audio_ref, data FROM check_items WHERE check_id = ? ORDER BY ord`).all(checkId) as
    (Omit<CheckItem, "data"> & { data: string })[]).map((r) => ({ ...r, data: parse<Record<string, unknown>>(r.data) ?? {} }));
}

/** First tries only: for the "a la primera" figure. */
export function firstTryStats(learnerId: string) {
  return progress().prepare(
    `SELECT COUNT(*) AS n, COALESCE(SUM(correct), 0) AS right FROM attempts a
     WHERE learner_id = ? AND id = (SELECT MIN(id) FROM attempts b WHERE b.learner_id = a.learner_id AND b.target_id = a.target_id)`,
  ).get(learnerId) as { n: number; right: number };
}

// ---------- reports ("Algo está mal") ----------
export type Report = {
  id: number; target_id: string; activity_id: string | null; reason: string; note: string | null; answer: string | null;
  snapshot: string | null; status: "open" | "dismissed"; created_at: string; fix_seen_at: string | null;
};
export type Fix = { report_id: number; target_id: string; unit_id: string | null; changed: number; note: string; fixed_at: string | null };

export function addReport(learnerId: string, r: Pick<Report, "target_id" | "activity_id" | "reason" | "note" | "answer" | "snapshot">) {
  return progress().prepare(
    `INSERT INTO reports (learner_id, target_id, activity_id, reason, note, answer, snapshot) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(learnerId, r.target_id, r.activity_id, r.reason, r.note, r.answer, r.snapshot).lastInsertRowid as number;
}

export function listReports(learnerId: string): Report[] {
  return progress().prepare(`SELECT * FROM reports WHERE learner_id = ? ORDER BY id DESC`).all(learnerId) as Report[];
}

/** What the pipeline did about her reports (course.db, from pipeline content/fixes.yaml). */
export function allFixes(): Map<number, Fix> {
  const rows = course().prepare(`SELECT * FROM fixes`).all() as Fix[];
  return new Map(rows.map((f) => [f.report_id, f]));
}

/** Fixes she hasn't been shown yet. */
export function pendingFixes(learnerId: string) {
  const fixes = allFixes();
  if (!fixes.size) return [];
  return listReports(learnerId)
    .filter((r) => !r.fix_seen_at && r.status === "open" && fixes.has(r.id))
    .map((r) => ({ report: r, fix: fixes.get(r.id)! }));
}

export function markFixesSeen(learnerId: string, ids: number[]) {
  const st = progress().prepare(`UPDATE reports SET fix_seen_at = datetime('now') WHERE learner_id = ? AND id = ? AND fix_seen_at IS NULL`);
  for (const id of ids) st.run(learnerId, id);
}

export function setReportStatus(id: number, status: "open" | "dismissed") {
  progress().prepare(`UPDATE reports SET status = ? WHERE id = ?`).run(status, id);
}

/** Every answer she gave, oldest first (owner page). */
export function progressAttempts(learnerId: string) {
  return progress().prepare(`SELECT target_id, answer, correct, created_at FROM attempts WHERE learner_id = ? ORDER BY id`).all(learnerId) as
    { target_id: string; answer: string | null; correct: number; created_at: string }[];
}
