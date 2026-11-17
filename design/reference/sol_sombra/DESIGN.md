---
name: Sol & Sombra
colors:
  surface: '#fcf9f3'
  surface-dim: '#dcdad4'
  surface-bright: '#fcf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ed'
  surface-container: '#f0eee8'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e5e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#57423b'
  inverse-surface: '#31312d'
  inverse-on-surface: '#f3f0ea'
  outline: '#8a726a'
  outline-variant: '#dec0b7'
  surface-tint: '#a23e18'
  primary: '#9f3c16'
  on-primary: '#ffffff'
  primary-container: '#bf542c'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59c'
  secondary: '#7e5700'
  on-secondary: '#ffffff'
  secondary-container: '#fdbe50'
  on-secondary-container: '#714d00'
  tertiary: '#43634d'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b7c65'
  on-tertiary-container: '#f6fff5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcf'
  primary-fixed-dim: '#ffb59c'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#822801'
  secondary-fixed: '#ffdead'
  secondary-fixed-dim: '#fabc4d'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#604100'
  tertiary-fixed: '#c7ebd0'
  tertiary-fixed-dim: '#abcfb4'
  on-tertiary-fixed: '#012110'
  on-tertiary-fixed-variant: '#2e4d39'
  background: '#fcf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e5e2dc'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1.25rem
  margin-compact: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a sunny, welcoming, and culturally rooted approach to mobile language acquisition. Centered around a charming dapple dachshund mascot in an artisan mini-sombrero, the visual tone balances the warmth and craft of Latin American design traditions—hand-glazed terra cotta, adobe plaster, sun-drenched courtyards, and agave foliage—with the crisp utility of a modern pocket tutor.

The target audience includes adult and continuing learners seeking a supportive, non-punitive language routine. The interface evokes feelings of warm hospitality, patient encouragement, and daily delight. It intentionally avoids noisy gamification cliches, garish neon badges, and infantilizing cartoon clutter. Instead, it pairs grounded earthy tones with generous touch zones, cozy tactile card elevations, and human-paced progress rituals.

The aesthetic blends **Modern Organic Minimalism** with **Warm Tactile Nuances**:
- Soft, pill-shaped action surfaces that feel friendly and natural under the thumb.
- Creamy lime-washed backdrops that remove eye fatigue during extended evening reading.
- Crisp typographic grounding to preserve educational seriousness and linguistic clarity.

## Colors

The palette draws straight from natural sunbaked landscapes and regional Latin American architecture:

- **Primary (`#C85A32` - Terracotta Clay):** The foundational brand color used for core call-to-actions, active states, key conversational prompts, and dominant progress points. Evokes hand-molded earthenware and sun-warmed bricks.
- **Secondary (`#E5A93C` - Warm Canela / Sunshine):** An optimistic amber accent reserved for streak celebrations, pronunciation mastery stars, canine reward bone chips, and high-energy encouragement.
- **Tertiary (`#5B7C65` - Agave / Soft Sage):** A restorative green used for correct answer validations, completed chapter checkmarks, grammatical hints, and peaceful milestone summaries.
- **Neutral (`#F9F6F0` - Plaster White / Warm Crema):** The dominant canvas substrate. Replaces sterile blue-toned device whites with a soothing, reflective plaster warmth that reduces eye strain and flatters the terracotta core.
- **Text & Surface Contrast:** Deep warm espresso tones (`#2C221E`) replace pure black for primary typography, preserving organic harmony while exceeding WCAG AAA contrast ratios against the cream background. Secondary text uses a toasted pebble brown (`#685E57`).

## Typography

The typographic hierarchy uses **Plus Jakarta Sans** for headings, vocabulary prompts, and contextual body copy, providing geometric warmth and friendly, open apertures. **Inter** is designated for functional micro-labels, metadata, pronunciation phonetic aids, and navigation items due to its high-legibility x-height and mechanical clarity at small sizes.

### Usage Directives:
- **Vocab Words & Phrase Headers:** Always set in `headline-lg` or `headline-md` with `fontWeight: 700` to anchor the study canvas.
- **Phonetics & Grammar Notes:** Rendered in `label-md` or `body-sm`, styled in espresso-tinted medium contrast to offer guidance without competing with vocabulary cards.
- **Bilingual Emphasis:** When Spanish sample sentences are displayed, use `fontWeight: 600` for the target phrase and italicized neutral `body-md` for the English literal translation below it.

## Layout & Spacing

This design system is engineered expressly for a portrait-first handheld viewport (~390px baseline width). The rhythm adheres to a cohesive 4px/8px modular base scale, calibrated to support comfortable one-thumb ergonomics in the bottom two-thirds of the screen.

### Grid & Ergonomics
- **Screen Margin:** 20px (`1.25rem`) fixed outer margins ensure buttons and cards never press against physical glass bezels or dynamic island boundaries.
- **Card Gutter:** 16px (`1rem`) vertical stack distance between learning blocks, exercise options, and conversational dialogue bubbles.
- **Touch Reach Zone:** Primary confirmation buttons and interactive sound triggers remain pinned or biased to the lower screen envelope (`space-xl` clearance from the home indicator).
- **Safe Tap Bounds:** All tappable chips, multiple-choice tokens, and audio replay triggers strictly enforce an absolute minimum touch boundary of 48x48px (exceeding standard 44px baselines).

## Elevation & Depth

Visual hierarchy uses warm, sun-cast ambient depth instead of stark drop shadows or sharp borders. Surfaces suggest smooth terracotta tilework and layered cardstock resting gently above adobe surfaces.

- **Base Canvas:** `#F9F6F0` (Plaster White) provides a calm, unified floor.
- **Surface Elevation 1 (Interactive Cards & Word Tiles):** `#FFFFFF` pure white fill with a soft tinted drop shadow: `0 4px 16px rgba(44, 34, 30, 0.06)`, finished with an ultra-fine 1px perimeter border in `rgba(200, 90, 50, 0.08)`. This keeps cards luminous against the warm cream canvas.
- **Surface Elevation 2 (Active Modals, Mascot Hint Balloons & Bottom Sheets):** `#FFFFFF` fill paired with `0 10px 28px rgba(44, 34, 30, 0.10)`.
- **Pressed & Inactive States:** Tapped cards physically compress 2px downward via simple vertical translation, flattening the shadow to `0 1px 4px rgba(44, 34, 30, 0.08)` to simulate an authentic tactile keypress.
- **Borders & Dividers:** Never employ harsh `#000000` or neutral industrial grays. Divider rules use 1px solid `rgba(74, 52, 42, 0.08)`.

## Shapes

The interface embraces a pill-dominated, organic geometry (`roundedness: 3`). Fully rounded silhouettes evoke pebble-smooth warmth and playful safety, matching the canine mascot's friendly nature.

- **Primary Action Buttons:** Continuous pill contours (`border-radius: 9999px`) provide inviting touch surfaces for lesson progression.
- **Content Cards & Lesson Hubs:** Generous corner radius (`rounded-xl` / 24px) gives flashcard units an inviting, handheld feel.
- **Word Selection Chips & Tags:** Pill-shaped capsules (`border-radius: 9999px`) with generous internal horizontal padding for easy finger landing.
- **Progress Trackers:** Rounded terminal caps on all progress indicators and lesson bar fills to preserve soft movement.

## Components

### Buttons
- **Primary Action ("Continuar", "Verificar"):** Pill-shaped, min-height 52px, filled with Terracotta (`#C85A32`) with white bold text (`label-lg`). Subtly grounded by an inset baseline border (`2px solid #A84420`) that gives a tactile push-button presence.
- **Secondary / Audio Pronunciation Buttons:** Cream-filled (`#FFFFFF`) with Terracotta outline (1.5px solid `#C85A32`), hosting an icon and text label. Min-height 48px.
- **Ghost Action:** Flat surface, toasted espresso text, dedicated strictly to "Saltar" (Skip) or secondary dismissal actions.

### Mascot Dialogue & Hint Balloon
- **Speech Bubble Container:** Elevated pure-white card with a tiny organic directional tail pointing toward the mascot illustration. Padding 16px. Contains supportive phrases ("¡Casi lo tienes!", "Escucha de nuevo").
- **Mascot Frame:** Dedicated circular badge or floating vector frame (~72px - 96px diameter) that showcases the dapple dachshund with joyful micro-expressions (ears perked during correct answers, resting head during pauses).

### Interactive Chips & Selectable Word Tiles
- **Default State:** Elevated white tile, 1.5px outline in `rgba(44, 34, 30, 0.08)`, text in deep espresso `body-md`. Min-height 48px.
- **Selected State:** Light terracotta wash background (`#FAEEE9`), border color transitions to Terracotta (`#C85A32`), text weight increases to 600.
- **Correct State:** Soft sage wash (`#EDF3EF`), border in Agave (`#5B7C65`), accompanied by a micro green check icon.
- **Incorrect Shake State:** Muted brick tint with a 3-cycle horizontal micro-haptic shake.

### Progress Meters & Streaks
- **Lesson Progress Bar:** 10px tall track in muted warm sand (`#EAE3D6`), filling with continuous Terracotta (`#C85A32`) using a spring-eased transition and rounded end-caps.
- **Daily Streak Pill:** Top-nav badge featuring an amber sunshine spark icon (`#E5A93C`), accompanied by bold counter text (e.g., "7 Días") on a soft vanilla chip background (`#FFF8EC`).

### Exercise Flashcards
- **Card Surface:** Stacked card layout with rounded-xl corners (24px). Contains target word in `headline-lg`, audio speaker icon (min 48x48px tap container), and contextual visual cue or sentence container separated by a hairline terra-tinted divider.