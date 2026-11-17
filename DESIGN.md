---
name: Camino con Mushroom
description: A warm, patient pocket tutor for one learner's Spanish course, in Sol & Sombra plaster and terracotta.
colors:
  terra: "#c85a32"
  terra-deep: "#9f3c16"
  terra-baseline: "#7a2a0c"
  terra-wash: "#faeee9"
  canela: "#e5a93c"
  canela-deep: "#7e5700"
  canela-wash: "#fff8ec"
  agave: "#5b7c65"
  agave-deep: "#43634d"
  agave-wash: "#edf3ef"
  agave-soft: "#c7ebd0"
  crema: "#fcf9f3"
  crema-low: "#f6f3ed"
  crema-mid: "#f0eee8"
  sand: "#eae3d6"
  sand-deep: "#dccfba"
  sheet-sand: "#f6e7d4"
  card-white: "#ffffff"
  espresso: "#2c221e"
  pebble: "#685e57"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: "40px"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: "32px"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.015em"
  phrase:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "26px"
  body-lg:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "26px"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
  button:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    letterSpacing: "0.01em"
rounded:
  tile: "20px"
  card: "24px"
  sheet: "32px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.terra-deep}"
    textColor: "{colors.card-white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "52px"
  button-primary-correct:
    backgroundColor: "{colors.agave-deep}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-primary-disabled:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.pebble}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.terra-deep}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-listen:
    backgroundColor: "{colors.terra-wash}"
    textColor: "{colors.terra-deep}"
    rounded: "{rounded.pill}"
    size: "48px"
  card:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.card}"
    padding: "20px"
  choice-tile:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.tile}"
    padding: "12px 16px"
    height: "64px"
  choice-tile-selected:
    backgroundColor: "{colors.terra-wash}"
    textColor: "{colors.terra-deep}"
    rounded: "{rounded.tile}"
  input-answer:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.card}"
    padding: "0 20px"
    height: "64px"
  chip-sessions:
    backgroundColor: "{colors.canela-wash}"
    textColor: "{colors.canela-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "36px"
  feedback-sheet-correct:
    backgroundColor: "{colors.agave-soft}"
    textColor: "{colors.agave-deep}"
    rounded: "{rounded.sheet}"
  feedback-sheet-retry:
    backgroundColor: "{colors.sheet-sand}"
    textColor: "{colors.terra-deep}"
    rounded: "{rounded.sheet}"
---

# Design System: Camino con Mushroom

## Overview

**Creative North Star: "The Courtyard Tutor"**

A sunlit plaster courtyard where a small dog teaches one person Spanish, one sentence at a time. The ground is warm crema plaster; everything she touches rests on it as soft white cards with a faint terracotta hairline and a warm, low shadow. Terracotta carries every decision, agave green confirms what is right or finished, and canela is kept for the quiet glow of sessions done. Mushroom, the dachshund cut-out, is always present as a tutor rather than a mascot decoration: he asks, listens, explains and reacts.

The system is calm and low-density: one task per screen, one primary action pinned at the bottom of a phone-width column, generous type, and tap targets of 48px or more. Feedback is kind by construction. A wrong answer raises a warm sand sheet that says "Casi" and offers another go; nothing flashes red and nothing is taken away. Progress is shown only where it means something: session dots, a thin terracotta progress bar, a winding trail of unit stones.

The build is light only. There is no dark theme, and none of the arcade apparatus of the category (hearts, lives, XP, leagues, streak counters, confetti) exists in the system.

**Key Characteristics:**
- Crema plaster ground, white cards, warm espresso-tinted shadows.
- Terracotta for action, agave for correct and completed, canela for celebration.
- Plus Jakarta Sans for voice, Inter for small labels and buttons.
- Fully rounded pills with a pressed baseline edge; 24px card corners.
- Mushroom cut-outs with a speech balloon in every lesson moment.
- One task, one bottom pill, one feedback sheet.

## Colors

A sun-and-shade palette: warm plaster neutrals, one clay accent, and two supporting earth tones that each have exactly one job.

### Primary
- **Terracotta Clay** (terra): fills for things that are large and wordless or carry only an icon: the current stone on the trail, the big listen button, the progress bar and current-session dot, the selected-tile border, the focus ring.
- **Fired Terracotta** (terra-deep): every primary pill, selected-tile text and badge, speaker names, the "Casi" title. This is the shade that carries white or text.
- **Kiln Baseline** (terra-baseline): the 3px inset bottom edge of terracotta pills that flattens when pressed.
- **Terracotta Wash** (terra-wash): the small listen button, the selected choice tile, the halo ring around the current stone.

### Secondary
- **Agave** (agave): completed stones, completed session dots and numbers, ticked self-check circles, trail dots (full for walked segments, 35% opacity for the road ahead).
- **Deep Agave** (agave-deep): the "Me salió" pill, the continue pill on a correct sheet, correct-sheet title, labels on model answers.
- **Agave Wash** (agave-wash): completed session rows and revealed model-answer cards (with a 25% agave hairline).
- **Sage Sheet** (agave-soft): the correct-answer feedback sheet.

### Tertiary
- **Canela Sun** (canela): the sun icon in the sessions chip and the small check medal on finished stones.
- **Canela Bark** (canela-deep): sessions-chip text and the "answer aloud" microphone icon.
- **Canela Glow** (canela-wash): the sessions chip ground.

### Neutral
- **Crema Plaster** (crema): page ground, browser theme color, the backing behind trail labels, the fade under the pinned bottom bar.
- **Shaded Plaster** (crema-low): unvisited trail stones.
- **Worn Plaster** (crema-mid): letter badges on unselected tiles, the speed toggle track, checklist chips, the ground of an eliminated wrong choice, hover ground of icon buttons.
- **Sand** (sand): empty progress track, pending session dots, disabled pills.
- **Deep Sand** (sand-deep): outline of later stones, unticked self-check circles, the dashed sentence-frame border.
- **Warm Sand Sheet** (sheet-sand): the try-again feedback sheet.
- **Card White** (card-white): cards, tiles, inputs, the speech balloon, the selected speed segment.
- **Espresso** (espresso): all primary text.
- **Pebble** (pebble): secondary text, glosses, meta lines, inactive icons, placeholders.

### Named Rules
**The Fired Clay Rule.** Words sit on terra-deep, never on terra. White text on the brighter terra fill is reserved for icons and shapes; any pill, badge or title with words uses terra-deep.

**The One Job Rule.** Agave means right or finished. Canela means sessions done. Neither is ever used as decoration or as a second action color.

**The No Red Rule.** A miss is shown in warm sand with a terracotta title, never in an alarm red. The eliminated choice greys back to worn plaster and shakes once.

## Typography

**Display Font:** Plus Jakarta Sans (with ui-sans-serif, system-ui)
**Label Font:** Inter (with ui-sans-serif, system-ui)

**Character:** Jakarta is round and friendly and carries everything Mushroom or the course "says"; it runs with stylistic set 01 on throughout. Inter appears only small, for meta lines, labels, chips, counters and pill buttons, where its plainer forms read faster.

### Hierarchy
- **Display** (800, 32px, 40px): only the session-done celebration headline.
- **Headline** (800, 26–28px, 32–36px, -0.02em): the active unit card title on the Camino and the unit page title.
- **Title** (700, 24px, 32px, -0.015em): the one question or instruction on a lesson screen; the feedback-sheet verdict runs at the same size in 800. A spoken target line in a balloon is 22px/30px bold.
- **Phrase** (600, 17–18px, 24–26px): Spanish lines, examples, dialogue lines and choices, often paired with a 15px italic pebble gloss beneath.
- **Body Large** (400, 17px, 26px): reading passages, notes, goals, answer feedback.
- **Body** (400, 15px, 22px): can-do lines on cards, balloon text, self-check items.
- **Label** (Inter 600, 12–13px): meta lines ("Sesión 1 de 5 ·"), chips, counters, speaker names and the caption over a revealed model answer. Sentence case, never tracked uppercase.

### Named Rules
**The Counted Digits Rule.** Every counter and fraction (sessions, 2/6, session numbers) uses tabular figures.

**The Sentence Case Rule.** No text in the system is set in tracked uppercase, and no label sits above a heading as a kicker.

## Layout

Single phone-width column (max 480px) centred on the crema ground; on desktop it is the same column floating on plaster, with no separate desktop layout. Side gutter is 20px. Lesson screens stack header, Mushroom plus task, answer controls, with 24px between blocks and 12px between sibling tiles or rows; card padding is 20px (24px for reading passages).

The lesson header is sticky on 90% crema with a light blur: a 48px close button, a 10px progress bar and a tabular counter. The primary action is pinned to the bottom in a bar that fades from crema at 70% to transparent, respecting the safe-area inset; the content area keeps 160px of bottom padding so nothing hides behind it.

The Camino is a vertical trail: stones step through fixed horizontal positions (50%, 74%, 50%, 26%) at a 176px row pitch, joined by evenly spaced agave dots along curves that stop short of each stone and its label.

## Elevation & Depth

Soft and warm. Depth comes from white surfaces lifted off plaster by low, espresso-tinted shadows, never grey or black ones, plus tonal washes for state. Nothing floats high except the feedback sheet and the speech balloon.

### Shadow Vocabulary
- **Rest** (`0 4px 16px rgba(44, 34, 30, 0.06)`): cards, unselected tiles, the incoming message bubble, completed stones.
- **Lift** (`0 10px 28px rgba(44, 34, 30, 0.1)`): Mushroom's speech balloon; the feedback sheet uses the same depth turned upward.
- **Press** (`0 1px 4px rgba(44, 34, 30, 0.08)`): selected tiles and the selected speed segment, which sit closer to the surface.
- **Clay glow** (`0 10px 24px rgba(200, 90, 50, 0.32–0.35)`): only the current trail stone and the big listen button.
- **Pressed baseline** (`inset 0 -3px 0` terra-baseline, or 22% black on agave): the bottom edge of primary pills; removed on press as the pill moves down 2px.

### Named Rules
**The Press Down Rule.** Things you tap move down 2px when pressed and lose their baseline or shadow; nothing grows or lifts on hover.

## Shapes

Everything is rounded and soft. Pills, stones, badges, chips and icon buttons are fully round; cards and inputs use 24px corners; choice tiles, the speech balloon and the sentence frame use 20px; the feedback sheet rounds its top corners at 32px. Borders are hairlines (1px terracotta at 8% on cards, 1.5px on tiles and outlined controls). Mushroom is always a free cut-out with a soft drop shadow, never framed, masked or cropped into a shape.

## Components

### Buttons
- **Shape:** fully round pill, 52px minimum height, 24px side padding, Inter 700 at 16px, full width in the bottom bar.
- **Primary:** fired terracotta with white text and the kiln baseline; a trailing arrow or chevron when it moves forward.
- **Correct / "Me salió":** deep agave with a darkened baseline.
- **Secondary ("Otra vez"):** white with a 1.5px terracotta border and fired terracotta text, sharing the row with the agave pill.
- **Disabled:** sand ground, pebble text at 70%, no baseline.
- **Press / Focus:** 120ms move down 2px on the expo ease; focus is a 2.5px terracotta outline offset 3px.

### Listen Buttons
- **Small:** 48px terracotta-wash circle with a fired-terracotta speaker icon, beside any Spanish line; scales to 95% on press.
- **Large:** 96px terracotta circle with an 8px wash ring and clay glow; pulses while speaking. Below it, a Normal / Despacio segmented toggle on worn plaster.

### Chips
- **Sessions chip:** canela glow pill with sun icon and tabular count, top right of the Camino.
- **Checklist chips:** worn-plaster pills with pebble Inter labels.
- **Rating chips:** white pills with resting shadow; selected becomes terracotta wash with a terracotta border.

### Cards / Containers
- **Corner Style:** 24px.
- **Background:** card white; agave wash for completed rows and model answers.
- **Shadow Strategy:** Rest shadow (see Elevation).
- **Border:** 1px terracotta hairline at 8%; dividers inside cards are 8% warm brown.
- **Internal Padding:** 20px.

### Choice Tiles
White 20px-corner tiles, 64px minimum, with a round letter badge (A, B, C) and the answer text. Selected: terracotta border, terracotta wash, fired terracotta text and a fired terracotta badge. Eliminated: worn plaster at 55% opacity, disabled, after one 360ms shake.

### Inputs / Fields
- **Style:** the card treatment at 64px, 19px semibold answer text, pebble placeholder.
- **Focus:** border turns terracotta; the global terracotta focus ring applies.
- **Helper:** a 13px pebble line beneath ("Sin acentos también vale.").

### Navigation
No tab bar. The Camino trail is the navigation: unit stones (64px; current 80px terracotta with a 10px wash halo and clay glow; done agave with a canela check medal; later stones crema-low with a deep-sand outline) with their titles on a crema label pill. Sub-screens use a single 48px back or close icon button top left.

### Mushroom and his Balloon (signature)
Eight cut-out expressions (friendly, teaching, thinking, curious, excited, proud, oops, listening) chosen by what is happening: listening on listen steps, teaching on notes, thinking on questions, curious on speaking, excited on a right answer, oops then teaching on misses, proud at session end. Beside a task he sits at 60px next to the heading; when he speaks he sits at 72–84px beside a white balloon (20px corners, Lift shadow, a rotated-square tail pointing at him).

### Feedback Sheet (signature)
The check moment. The pinned pill is replaced by a sheet rising from the bottom (420ms, expo ease) with 32px top corners: sage for right (an "¡Excelente!" style title in deep agave), warm sand for a miss ("Casi", then "Así se dice" with the answer on the second miss, in fired terracotta). Mushroom overlaps the top edge at 76px with the matching expression, the answer is read aloud when it is Spanish, and the sheet's own pill takes focus.

## Do's and Don'ts

### Do:
- **Do** put text-bearing terracotta on terra-deep and keep terra for wordless fills, per the Fired Clay Rule.
- **Do** give every tappable thing at least 48px, and every primary pill 52px.
- **Do** pin one primary pill to the bottom of lesson screens, over the crema fade.
- **Do** show Mushroom with a fitting expression from the eight cut-outs on every lesson and summary screen.
- **Do** answer a check with the feedback sheet: sage for right, warm sand for try again.
- **Do** honour reduced motion; every animation and transition collapses to 1ms.

### Don't:
- **Don't** add hearts, lives, XP, leagues, streak counters or confetti.
- **Don't** put kicker or eyebrow labels above headings, or set any text in tracked uppercase.
- **Don't** use an alarm red for misses or grey drop shadows; misses are warm sand, drop shadows are espresso-tinted.
- **Don't** redraw Mushroom, crop him into circles or other masks, or put him in a frame.
- **Don't** introduce new hex values in components; extend the palette in the theme first.
- **Don't** add a dark theme without designing one; the system is light only.
