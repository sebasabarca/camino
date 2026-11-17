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

FIRST VIEWPORT: Camino. Top bar: Mushroom badge + course name left, sessions-done chip right. Below, the active unit's card (title, can-do line, session dots, "Continuar" pill full width), then the winding path of the 6 pilot units as round stones on a sage trail, done stones agave with a check, the current one terracotta and larger, later ones sand. Lesson screens: close X + thin terracotta progress bar on top, Mushroom with balloon, the task, answer tiles, and the primary pill pinned to the bottom.

FORM: Owner-supplied reference world, built as standard mobile web controls. seed: none (roll skipped; only the world is pinned) — owner: "This is just a reference but i like the look and feel of the images." Those words pin the world (look and feel). The first-surface composition (Camino path, lesson layout) was taken from the same reference screens without a concept roll; this skip is disclosed to the owner, who can ask for alternative compositions. Trail adaptation: walked segments are full agave dots, unwalked segments agave dots at reduced opacity. Signature move: the check moment, where the pinned bottom pill becomes a feedback sheet that rises in sage (correct) or warm sand (try again) with Mushroom's matching expression and the line read aloud.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Unresolved: app name (placeholder "Camino con Mushroom"); speaking recordings are not captured in the pilot (she speaks aloud and self-checks); reviewer view for the owner comes later.
