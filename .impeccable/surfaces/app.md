---
version: 1
slug: "app"
primary_target: "app"
related_targets: []
---

# Learner app (pilot): Camino, unit, lesson player, session summary

Mode: Operate (the learner completes lessons). Platform: mobile web, iPhone Safari first; works on desktop as a centred phone-width column.

Audience and job: Serena, working alone through a 35-minute session on her phone: listen, read, answer, speak aloud, write, and see where she is on the course. Owner and partner read progress (later).

Constraints: content comes read-only from `data/course.db`; progress in `data/progress.db`; free browser speech for audio; non-punitive (no hearts, no lives, no XP, no streak guilt); no eyebrow kickers.

## Direction contract

THESIS: A patient, warm pocket tutor where Mushroom guides one real learner through real conversations. It refuses the category's gamified arcade (hearts, XP, leagues, confetti) and keeps only progress that means something: sessions done, can-do statements reached.

OWN-WORLD: "Sol & Sombra" as supplied by the owner: plaster-crema ground #FCF9F3, terracotta #C85A32 (primary, deep #9F3C16 for text and pressed edges), canela #E5A93C for celebration, agave #5B7C65 for correct and completed, espresso #2C221E text, pebble #685E57 secondary. White cards with warm tinted shadows and a 1px terracotta-tinted hairline, 24px card radius, pill buttons with a 2px darker baseline edge, 48px+ tap targets. Plus Jakarta Sans for voice, Inter for small labels. Mushroom the dachshund appears as a cut-out with his speech balloon.

STORY: She opens the app and sees exactly where she is on her camino and what's next; one tap starts the session; each activity asks one clear thing, checks it kindly, and moves on; the session ends with what she can now say.

FIRST VIEWPORT (updated 2026-11-18): Home is the sendero, a winding path with one round stop per lesson, units as banners and Mushroom beside the next lesson; the owner chose it from four options (ladder, today card, lesson grid, sendero) after the switch to teach-then-quiz lessons. Later stops show their number, never a lock. Superseded: the can-do ladder below (owner chose it in an earlier surface round). Top bar: Mushroom + course name + 'Hola, Serena', sessions chip right. Heading 'Lo que ya puedes hacer'. A vertical ladder of the 6 units on one rail (agave where walked, sand ahead): done rungs are agave dots with a check and the unit's title; the current rung is a lifted white card with a terracotta-ringed number, its can-do statement in full, five session bars (agave done, terracotta now, sand later), the session label, a full-width Continuar pill, and a 'Ver las N sesiones' link (product truth: the unit page is the only route to replay a session); done and later rungs show the unit title on one line with a state line. Navigation: a bottom tab bar Camino · Repasar · Yo (owner-chosen), hidden inside lessons and on the session summary, which own the bottom for their single action. Lesson screens: close X + thin terracotta progress bar on top, Mushroom with balloon, the task, answer tiles, and the primary pill pinned to the bottom.

FORM: Home composition: dealt structure 3 of 7 on my list ('Can-do ladder'), chosen by the owner on the decision page; seed:534b768bdba2eb19. Rest of the surface: owner-supplied reference world, built as standard mobile web controls. seed: none (roll skipped; only the world is pinned) — owner: "This is just a reference but i like the look and feel of the images." Those words pin the world (look and feel). The lesson composition was taken from the same reference screens without a concept roll (disclosed to the owner); the home was then re-chosen by the owner in a surface round (the trail home is superseded). Signature move: the check moment, where the pinned bottom pill becomes a feedback sheet that rises in sage (correct) or warm sand (try again) with Mushroom's matching expression and the line read aloud.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Unresolved: app name (placeholder "Camino con Mushroom"); speaking recordings are not captured in the pilot (she speaks aloud and self-checks); reviewer view for the owner comes later.
