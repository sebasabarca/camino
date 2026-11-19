# App: Serena's Spanish course (web)

The learner-facing web app. Next.js 15 (App Router) + TypeScript + Tailwind 4 + SQLite. Mobile-first: Serena uses it on her iPhone in Safari.

Read `PRODUCT.md` (who it's for, principles) and `.impeccable/surfaces/app.md` (the design direction contract) before changing UI.

## Run

```bash
nvm use            # Node 24 (.nvmrc). Tailwind 4 needs Node >= 20.19
npm install
npm run dev        # http://localhost:3000
npm run build      # typecheck + production build
node --test lib/answer.test.ts lib/steps.test.ts
```

**This repo is only the app** (it is what goes to GitHub). Course content is made by a separate, local-only pipeline
(`../pipeline`, its own git repo, never pushed); its export writes `data/course.db` here, which is committed so the server
can deploy from git. Never commit `progress.db`, `data/backups/` or `.env.local` (all git-ignored).

## Data

- `data/course.db`: read-only course content, rebuilt by the pipeline export (path override: `COURSE_DB`). **Never write to it, never hand-edit it.** Content fixes go in `../pipeline/content/*` YAML, then validate and re-export.
- `$DATA_DIR/progress.db` (default `data/`): Serena's progress and answers, created on first use. `DATA_DIR` holds only progress and backups, never course.db. It is real learner data: never delete or reset it casually; use `DATA_DIR=<scratch dir>` when testing so test clicks don't land in her progress.
- All DB access is in `lib/db.ts` (server only). If you change the export schema in `../pipeline/tools/export_db.py`, bump `SCHEMA_VERSION` and update `lib/db.ts` in the same change.
- One learner (`lib/learner.ts`). **Login** (`middleware.ts`, `lib/auth.ts`): `APP_PASSWORD` (Serena), `OWNER_PASSWORD`
  (owner: also `/admin`) and `AUTH_SECRET` (≥ 32 chars) come from the environment (`.env.local` locally, git-ignored).
  A signed cookie lasts a year. Without them, dev is open and a production server refuses to run (503).
- **Backups:** `data/backups/progress-YYYY-MM-DD.db`, one a day (taken on first use that day), newest 30 kept. Copy
  them off the server now and then.

## How a lesson works

**Lesson format (since 2026-11-18, Serena's request): teach, then quiz.** Units whose `units.format` is `lessons`
(pipeline `schema/lesson-format.md`) are a run of short lessons, each exported as one session with one `lesson`
activity, plus a final "Prueba de la unidad" session.
- `lib/lesson-steps.ts` turns a lesson into `teach` cards (word, phrase, rule, conjugation, tip), then exercises:
  `pick` (choose meaning / choose Spanish / fill-choice), `match`, `tiles`, `fill` (gap, conjugate, translate).
  Choice and tile orders are shuffled with a seed from the id, so server and client agree.
- `components/lesson-player.tsx` plays them. In a lesson, a miss gets a hint and another go, and anything missed
  comes back once at the end; in the unit check, one try, no hints. The summary shows "N de M a la primera".
- Sound is optional: small speaker buttons only. Nothing auto-plays.
- The app shows only lesson-format units (`lib/course.ts`), all of them, not only the pilot.
- **Help in lessons and practice (never in the unit check)**, added in `lib/help.ts`:
  - **"Tarjeta"** reopens the teach card behind the exercise, found by its item ids, then by matching card text, then from its lesson.
  - **Tap-a-word:** dotted words in a gap sentence show their meaning, from word cards and conjugation tables.
  - **Letter marks:** a typed answer that is nearly right gets its wrong letters marked (`letterDiff` in `lib/answer.ts`). After the first miss only her letters are marked; after the second, the answer is shown.
- **Resume:** the player saves its position after every step (`lesson_state` in progress.db, keyed to the lesson's step ids), so a closed tab resumes at the same step.
- **Practicar** (`/practicar`, entered from Repasar) is spaced review, using Leitner boxes in the `review` table:
  - A first-try miss in a lesson sends the exercise to box 0, due now.
  - An exercise never missed comes due 1 day after its lesson.
  - In practice, a right answer moves it up a box (1, 3, 7, 14, 30 days) and a miss sends it back to 0.
  - A right answer after opening the card doesn't move it up.
  - Each round is up to 12 exercises, one per item, missed ones first.
- **Delayed checks:** `<unit>-check-d` opens `release_after_days` (about 24) after she finishes the unit check. It shows as an
  "¿Aún lo recuerdas?" card on the home path and runs at `/prueba/<checkId>` in check mode (one try, no help).
- **Reports ("Algo está mal"):** the flag in the player header saves a report (`reports` in progress.db, kept for
  good, with the step as she saw it). The pipeline reads them (`sgo.py reports`, `sgo.py fix-reports`: Codex fixes the
  exercise and writes a one-line note for her), records them in `pipeline/content/fixes.yaml`, and the export ships them
  as `fixes` in course.db. At her next lesson a "Lo arreglamos" sheet shows the notes once, and the fixed exercises go
  back into Practicar.
- **Owner page** `/admin`: activity over the last 14 days, first-try rates per unit, check and memory-check results, most-missed
  exercises, her reports (dismiss the ones that need no change; JSON download for the pipeline) and backups.
- **Daily goal:** one lesson a day, shown on the home chip and on Yo. It starts fresh each day: no streaks.
- **Home screen:** `app/manifest.ts` plus Mushroom icons (`public/icon-*.png`, `app/apple-icon.png`) let her add it
  from Safari (Share → Add to Home Screen). It still needs the server to work: there is no offline mode.
- Shared lesson UI (bottom bar, pill, speaker button, feedback sheet) is in `components/ui.tsx`.
- `lib/answer.ts` checks typed answers: accents, case and punctuation are forgiven, and since 2026-11-19 **n is accepted
  for ñ** (owner's call); an accepted answer missing a ñ gets a "Se escribe con ñ: «año»" note. Placeholders like
  `[número]` match any words. Keep its tests passing.
- Audio is the browser's free speech synthesis (`lib/speech.ts`), only on tap.
- The older dialogue format (sessions, listening, speaking) was removed from the app on 2026-11-19. Its content is in
  `../pipeline/content/legacy/v1/`, and its player is in git history (`components/player.tsx`, `lib/steps.ts`).

## Design rules (Sol & Sombra)

- Palette and tokens live in `app/globals.css` (`@theme`): crema ground, terracotta primary, canela for celebration, agave for correct/completed, espresso text. Use the tokens, not new hex values.
- Plus Jakarta Sans for voice, Inter (`font-label`) for small labels. Pill buttons with a darker baseline; white cards (`card` utility) with warm shadows; 48px minimum tap targets.
- Mushroom (`components/mushroom.tsx`) is the mascot and tutor: use the 8 cut-out expressions in `public/mushroom/` (friendly, teaching, thinking, curious, excited, proud, oops, listening). Never redraw or crop him into geometric masks.
- Non-punitive: no hearts, lives, XP, leagues or streak guilt. No eyebrow labels above headings.
- UI copy is Spanish (short, friendly); lesson content language comes from the pipeline.
- Learner facts (Serena): North Vancouver, Canada; science student; no job; sister, brother, father, mother; loves mountain biking, skiing, the outdoors; only dislike lasaña. Never invent others.
