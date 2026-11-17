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

Content must exist first: `cd ../pipeline && python3 tools/export_db.py` writes `data/course.db`.

## Data

- `data/course.db`: read-only course content, rebuilt by the pipeline export. **Never write to it, never hand-edit it.** Content fixes go in `../pipeline/content/*` YAML, then validate and re-export.
- `data/progress.db`: Serena's progress and answers, created on first use. It is real learner data: never delete or reset it casually; use `DATA_DIR=<scratch dir>` when testing so test clicks don't land in her progress.
- All DB access is in `lib/db.ts` (server only). If you change the export schema in `../pipeline/tools/export_db.py`, bump `SCHEMA_VERSION` and update `lib/db.ts` in the same change.
- Pilot has one learner and no login (`lib/learner.ts`). Add accounts before a second learner or a public deploy.

## How a lesson works

- `lib/steps.ts` turns any activity (or unit-check item) into a short list of steps: `listen`, `learn`, `choice`, `type`, `say`, `write`, `rate`. The client gets steps only.
- `components/player.tsx` renders one step at a time. The bottom pill is the main action; checking an answer raises the feedback sheet (sage = right, warm sand = try again). Two misses show the answer and move on: nothing is ever lost.
- `lib/answer.ts` checks typed answers: accents, case and punctuation are forgiven; **ñ stays distinct from n**; placeholders like `[número]` match any words. Keep its tests passing.
- Audio is the browser's free speech synthesis (`lib/speech.ts`), one voice per character. Real recordings will replace it later.
- Speaking is self-checked ("Ya lo dije" → model → "Me salió / Otra vez"); nothing is recorded in the pilot.

## Design rules (Sol & Sombra)

- Palette and tokens live in `app/globals.css` (`@theme`): crema ground, terracotta primary, canela for celebration, agave for correct/completed, espresso text. Use the tokens, not new hex values.
- Plus Jakarta Sans for voice, Inter (`font-label`) for small labels. Pill buttons with a darker baseline; white cards (`card` utility) with warm shadows; 48px minimum tap targets.
- Mushroom (`components/mushroom.tsx`) is the mascot and tutor: use the 8 cut-out expressions in `public/mushroom/` (friendly, teaching, thinking, curious, excited, proud, oops, listening). Never redraw or crop him into geometric masks.
- Non-punitive: no hearts, lives, XP, leagues or streak guilt. No eyebrow labels above headings.
- UI copy is Spanish (short, friendly); lesson content language comes from the pipeline.
- Learner facts (Serena): North Vancouver, Canada; science student; no job; sister, brother, father, mother; loves mountain biking, skiing, the outdoors; only dislike lasaña. Never invent others.
