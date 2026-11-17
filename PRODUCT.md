# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Serena (primary learner).** An adult from North Vancouver, Canada; studies science; student, no job. She works through the course alone, mostly on her iPhone in Safari, in daily sessions of about 35 minutes (or a 12-minute short version on busy days).
- **Sebastian (course owner) and a speaking partner.** They check her progress and read or listen to her answers, and score the speaking and writing tasks the app cannot judge.

## Product Purpose

A private Spanish course made for one person. It takes Serena from zero to real conversation (CEFR A1 → B2 over the roadmap), one unit at a time. Success is that she can actually talk: understand, speak and get her meaning across, not just tick boxes. The pilot (6 units) exists to get her feedback early.

## Positioning

Built around one real learner rather than an average user: the lessons use her real facts and life, aim at real conversation (meaning first, repair phrases like "¿Puedes repetir?", unpredictable prompts, a delayed check weeks later), and are non-punitive: no hearts, no lives, no streak guilt.

## Operating Context

- Each unit has 5 sessions; each session is a short run of activities: listening and reading with questions, explanations with examples, typed recall, guided speaking, unpredictable prompts, writing, a self-rating, and a unit check (plus a delayed check about 3–4 weeks later).
- Answers are checked leniently on accents ("Que hora es" is fine); ñ stays distinct from n. Speaking and writing are self-checked in the app and scored later by a person.
- Audio is not recorded yet; the browser's built-in Spanish voices read the scripts for now.
- Content comes from the course pipeline (`../pipeline`) as a read-only SQLite file; learner progress is stored separately.

## Capabilities and Constraints

- Next.js 15 + TypeScript + Tailwind 4; SQLite (`data/course.db` read-only content, `data/progress.db` learner data). Node 24.
- Pilot scope: work through units, answer and get checked, track progress. The pilot is also the first version of the design.
- Undecided: the app's name; how speaking recordings are captured and shared with the partner; hosting.

## Brand Commitments

- **Mushroom** is the mascot and tutor: a dapple dachshund with round glasses and a straw sombrero. He speaks in a dry, funny voice in the lessons (food is his favourite topic). Expression set: `design/reference/Mushroom Dachshund Expression Sticker Sheet.png` (friendly, teaching, thinking, curious, excited, proud, oops, listening).
- Spanish variety is broadly Latin American; vosotros is never used.

## Evidence on Hand

- Pilot content: 6 finalized units (`p0-sounds-01`, `p0-u01`, `a1-u01`…`a1-u04`) with unit checks.
- Visual reference supplied by the owner: "Sol & Sombra" DESIGN.md, 7 mock screens and the Mushroom sticker sheet (`design/reference/`).
- No testimonials, metrics or learner results exist yet; don't invent any.

## Product Principles

1. Her real life, not a template: content and examples are about Serena; never invent facts about her.
2. Conversation over completion: progress means she can do the can-do statement, not that she tapped through.
3. Patient, never punitive: mistakes get a hint and another go; there is nothing to lose.
4. Meaning first, then form: listen and understand before producing; support fades as she improves.

## Accessibility & Inclusion

Phone-first, one-handed use; large tap targets. Spanish text she reads or hears is correctly accented; answer checking forgives missing accents.
