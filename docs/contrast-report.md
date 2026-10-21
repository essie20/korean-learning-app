# Contrast fix: before/after evidence

Branch `fix/contrast-accessibility`, measured 2026-10-18 against the local
dev server. "Before" is the styling on `main` (1444ee0); "after" is this
branch. Both runs used the same script, pages, states and viewports.

## Result

|        | Measurements | Below threshold (by minimum) |
| ------ | ------------ | ---------------------------- |
| Before | 126          | 88                           |
| After  | 126          | **0**                        |

Thresholds (WCAG 2.2 AA): text 4.5:1, large text (≥ 24 px, or ≥ 18.66 px
bold) 3:1 (SC 1.4.3); icon that identifies a control and focus indicator
3:1 (SC 1.4.11). Pass/fail below uses the **minimum**.

## Changes

| Element                                                 | File                       | Change                                                                         |
| ------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| Pronunciation help close ✕ icon                         | `PronunciationPopover.tsx` | `text-slate-400` → `text-slate-600`; hover `text-slate-600` → `text-slate-900` |
| "Aihe 01–10" topic labels                               | `TopicCard.tsx`            | `text-slate-400` → `text-slate-600`                                            |
| "10 aihetta · 50 lausetta"                              | `HomePage.tsx`             | `text-slate-400` → `text-slate-600`                                            |
| Pronunciation "·" separator                             | `SentenceCard.tsx`         | `text-slate-400` → `text-slate-600`                                            |
| Nav subtitle "Pieniä lauseita, suuria hetkiä"           | `NavBar.tsx`               | `text-slate-500` → `text-slate-600`                                            |
| "valmiina"                                              | `HomePage.tsx`             | `text-slate-500` → `text-slate-600`                                            |
| Progress stat labels (3)                                | `ProgressPage.tsx`         | `text-slate-500` → `text-slate-600`                                            |
| Topics eyebrow "선택하세요 · Valitse aihe" (over photo) | `TopicsPage.tsx`           | `text-blue-700` → `text-blue-800`                                              |
| "arkilauseilla" gradient heading (over photo)           | `HomePage.tsx`             | gradient `blue-600 → indigo-600` → `blue-800 → indigo-800`                     |
| Home hero legibility wash                               | `HomePage.tsx`             | below `lg` only: `max-lg:via-white/80 max-lg:to-white/65` (desktop unchanged)  |

Darker text alone could not fix the hero heading at 375 px: the photo
behind it has pixels as dark as the text (before: minimum 1.16). The wash
change gives it a stable background where the text spans the full width.
No content, layout, sizes or behaviour changed.

## Measurements

Each cell: minimum / 5th percentile (p5) / median of per-pixel contrast.
The minimum is the lowest pixel measured; 95 % of measured pixels are at or
above p5. Rows that cover several states, cards or pages show the lowest
value of each statistic across them.

| Element                                 | Page                    | Width | State   | Needed | Before: colour → min / p5 / median      | After: colour → min / p5 / median      |
| --------------------------------------- | ----------------------- | ----- | ------- | ------ | --------------------------------------- | -------------------------------------- |
| close ✕ icon                            | Study                   | 375   | default | 3:1    | `#90a1b9` → 2.63 / 2.63 / 2.63 **fail** | `#45556c` → 7.58 / 7.58 / 7.58 pass    |
| close ✕ icon                            | Study                   | 375   | hover   | 3:1    | `#45556c` → 6.92 / 6.92 / 6.92          | `#0f172b` → 16.28 / 16.28 / 16.28 pass |
| close ✕ icon                            | Study                   | 375   | focus   | 3:1    | `#90a1b9` → 2.63 / 2.63 / 2.63 **fail** | `#45556c` → 7.58 / 7.58 / 7.58 pass    |
| close ✕ icon                            | Study                   | 1280  | default | 3:1    | `#90a1b9` → 2.63 / 2.63 / 2.63 **fail** | `#45556c` → 7.58 / 7.58 / 7.58 pass    |
| close ✕ icon                            | Study                   | 1280  | hover   | 3:1    | `#45556c` → 6.92 / 6.92 / 6.92          | `#0f172b` → 16.28 / 16.28 / 16.28 pass |
| close ✕ icon                            | Study                   | 1280  | focus   | 3:1    | `#90a1b9` → 2.63 / 2.63 / 2.63 **fail** | `#45556c` → 7.58 / 7.58 / 7.58 pass    |
| close button focus outline              | Study                   | 375   | focus   | 3:1    | `#1447e6` → 6.83 / 6.83 / 6.83          | `#1447e6` → 6.83 / 6.83 / 6.83 pass    |
| close button focus outline              | Study                   | 1280  | focus   | 3:1    | `#1447e6` → 6.83 / 6.83 / 6.83          | `#1447e6` → 6.83 / 6.83 / 6.83 pass    |
| pronunciation "·" separator             | Study                   | 375   | default | 4.5:1  | `#90a1b9` → 2.51 / 2.51 / 2.51 **fail** | `#45556c` → 7.25 / 7.25 / 7.25 pass    |
| pronunciation "·" separator             | Study                   | 1280  | default | 4.5:1  | `#90a1b9` → 2.51 / 2.51 / 2.51 **fail** | `#45556c` → 7.25 / 7.25 / 7.25 pass    |
| "10 aihetta · 50 lausetta"              | Home                    | 375   | default | 4.5:1  | `#90a1b9` → 2.51 / 2.51 / 2.53 **fail** | `#45556c` → 7.24 / 7.24 / 7.30 pass    |
| "10 aihetta · 50 lausetta"              | Home                    | 1280  | default | 4.5:1  | `#90a1b9` → 2.49 / 2.49 / 2.51 **fail** | `#45556c` → 7.18 / 7.18 / 7.24 pass    |
| "arkilauseilla" gradient h1             | Home                    | 375   | default | 3:1    | gradient → 1.16 / 2.56 / 4.52 **fail**  | gradient → 5.98 / 7.22 / 8.46 pass     |
| "arkilauseilla" gradient h1             | Home                    | 1280  | default | 3:1    | gradient → 4.97 / 5.10 / 5.49           | gradient → 8.34 / 8.50 / 8.92 pass     |
| "valmiina"                              | Home                    | 375   | default | 4.5:1  | `#62748e` → 4.49 / 4.50 / 4.54 **fail** | `#45556c` → 7.40 / 7.45 / 7.46 pass    |
| "valmiina"                              | Home                    | 1280  | default | 4.5:1  | `#62748e` → 4.34 / 4.46 / 4.59 **fail** | `#45556c` → 6.91 / 7.09 / 7.31 pass    |
| hero "안녕하세요!" (regression check)   | Home                    | 375   | default | 4.5:1  | `#432dd7` → 6.18 / 6.51 / 6.89          | `#432dd7` → 7.26 / 7.35 / 7.41 pass    |
| hero "안녕하세요!" (regression check)   | Home                    | 1280  | default | 4.5:1  | `#432dd7` → 7.64 / 7.71 / 7.84          | `#432dd7` → 7.64 / 7.71 / 7.84 pass    |
| hero intro paragraph (regression check) | Home                    | 375   | default | 4.5:1  | `#314158` → 5.32 / 7.80 / 8.92          | `#314158` → 8.31 / 9.38 / 9.74 pass    |
| hero intro paragraph (regression check) | Home                    | 1280  | default | 4.5:1  | `#314158` → 8.82 / 9.21 / 9.98          | `#314158` → 8.82 / 9.21 / 9.98 pass    |
| logo link focus outline                 | Home                    | 375   | focus   | 3:1    | `#1447e6` → 6.60 / 6.61 / 6.67          | `#1447e6` → 6.60 / 6.61 / 6.67 pass    |
| logo link focus outline                 | Home                    | 1280  | focus   | 3:1    | `#1447e6` → 6.59 / 6.59 / 6.65          | `#1447e6` → 6.59 / 6.59 / 6.65 pass    |
| nav subtitle                            | Home                    | 375   | default | 4.5:1  | `#62748e` → 4.61 / 4.61 / 4.65          | `#45556c` → 7.34 / 7.34 / 7.40 pass    |
| nav subtitle                            | Home                    | 375   | hover   | 4.5:1  | `#62748e` → 4.61 / 4.61 / 4.65          | `#45556c` → 7.34 / 7.34 / 7.40 pass    |
| nav subtitle                            | Home                    | 375   | focus   | 4.5:1  | `#62748e` → 4.61 / 4.61 / 4.65          | `#45556c` → 7.34 / 7.34 / 7.40 pass    |
| nav subtitle                            | Home                    | 1280  | default | 4.5:1  | `#62748e` → 4.60 / 4.60 / 4.64          | `#45556c` → 7.32 / 7.32 / 7.38 pass    |
| nav subtitle                            | Home                    | 1280  | hover   | 4.5:1  | `#62748e` → 4.60 / 4.60 / 4.64          | `#45556c` → 7.32 / 7.32 / 7.38 pass    |
| nav subtitle                            | Home                    | 1280  | focus   | 4.5:1  | `#62748e` → 4.60 / 4.60 / 4.64          | `#45556c` → 7.32 / 7.32 / 7.38 pass    |
| "Aihe 01–10" labels                     | Topics                  | 375   | default | 4.5:1  | `#90a1b9` → 2.45 / 2.46 / 2.48 **fail** | `#45556c` → 7.06 / 7.08 / 7.14 pass    |
| "Aihe 01–10" labels                     | Topics                  | 375   | hover   | 4.5:1  | `#90a1b9` → 2.45 / 2.47 / 2.48 **fail** | `#45556c` → 7.07 / 7.12 / 7.15 pass    |
| "Aihe 01–10" labels                     | Topics                  | 375   | focus   | 4.5:1  | `#90a1b9` → 2.45 / 2.47 / 2.48 **fail** | `#45556c` → 7.07 / 7.12 / 7.15 pass    |
| "Aihe 01–10" labels                     | Topics                  | 1280  | default | 4.5:1  | `#90a1b9` → 2.48 / 2.49 / 2.52 **fail** | `#45556c` → 7.15 / 7.17 / 7.27 pass    |
| "Aihe 01–10" labels                     | Topics                  | 1280  | hover   | 4.5:1  | `#90a1b9` → 2.49 / 2.52 / 2.53 **fail** | `#45556c` → 7.17 / 7.26 / 7.30 pass    |
| "Aihe 01–10" labels                     | Topics                  | 1280  | focus   | 4.5:1  | `#90a1b9` → 2.48 / 2.49 / 2.52 **fail** | `#45556c` → 7.16 / 7.17 / 7.28 pass    |
| eyebrow "선택하세요 · Valitse aihe"     | Topics                  | 375   | default | 4.5:1  | `#1447e6` → 3.70 / 3.83 / 4.34 **fail** | `#193cb8` → 4.78 / 4.95 / 5.60 pass    |
| eyebrow "선택하세요 · Valitse aihe"     | Topics                  | 1280  | default | 4.5:1  | `#1447e6` → 5.30 / 5.35 / 5.46          | `#193cb8` → 6.85 / 6.91 / 7.05 pass    |
| nav subtitle                            | Topics, Progress, Study | 375   | default | 4.5:1  | `#62748e` → 4.38 / 4.38 / 4.41 **fail** | `#45556c` → 6.97 / 6.97 / 7.03 pass    |
| nav subtitle                            | Topics, Progress, Study | 1280  | default | 4.5:1  | `#62748e` → 4.49 / 4.50 / 4.50 **fail** | `#45556c` → 7.16 / 7.17 / 7.17 pass    |
| Topic card focus outlines (10 cards)    | Topics                  | 375   | focus   | 3:1    | `#1447e6` → 3.70 / 3.89 / 4.65          | `#1447e6` → 3.70 / 3.89 / 4.65 pass    |
| Topic card focus outlines (10 cards)    | Topics                  | 1280  | focus   | 3:1    | `#1447e6` → 3.84 / 4.04 / 5.11          | `#1447e6` → 3.84 / 4.04 / 5.11 pass    |
| "Aihe 01–10" labels                     | Progress                | 375   | default | 4.5:1  | `#90a1b9` → 2.50 / 2.50 / 2.52 **fail** | `#45556c` → 7.20 / 7.20 / 7.28 pass    |
| "Aihe 01–10" labels                     | Progress                | 1280  | default | 4.5:1  | `#90a1b9` → 2.54 / 2.54 / 2.57 **fail** | `#45556c` → 7.33 / 7.33 / 7.41 pass    |
| "Kokonaisedistyminen"                   | Progress                | 375   | default | 4.5:1  | `#62748e` → 4.29 / 4.36 / 4.44 **fail** | `#45556c` → 6.83 / 6.95 / 7.08 pass    |
| "Kokonaisedistyminen"                   | Progress                | 1280  | default | 4.5:1  | `#62748e` → 4.45 / 4.49 / 4.53 **fail** | `#45556c` → 7.08 / 7.14 / 7.21 pass    |
| "Suoritetut aiheet"                     | Progress                | 375   | default | 4.5:1  | `#62748e` → 4.25 / 4.33 / 4.41 **fail** | `#45556c` → 6.77 / 6.89 / 7.02 pass    |
| "Suoritetut aiheet"                     | Progress                | 1280  | default | 4.5:1  | `#62748e` → 4.38 / 4.42 / 4.48 **fail** | `#45556c` → 6.97 / 7.03 / 7.14 pass    |
| "Suoritukset yhteensä"                  | Progress                | 375   | default | 4.5:1  | `#62748e` → 4.18 / 4.25 / 4.34 **fail** | `#45556c` → 6.66 / 6.77 / 6.91 pass    |
| "Suoritukset yhteensä"                  | Progress                | 1280  | default | 4.5:1  | `#62748e` → 4.26 / 4.30 / 4.37 **fail** | `#45556c` → 6.78 / 6.84 / 6.95 pass    |

The topic card and focus outline rows did not change (their colours were
not edited); they are included because the card and close-button states
were re-checked.

## Method

- Headless Microsoft Edge driven via the DevTools protocol, viewports
  375×812 (mobile emulation) and 1280×800, device scale factor 1,
  transitions/animations disabled during measurement so hover and focus
  colours are final.
- **Foreground:** the element's computed colour converted to sRGB by the
  browser's canvas, multiplied by its effective opacity.
- **Background:** real pixels from a viewport screenshot in which only the
  measured element's glyph fill (or icon) is hidden — every pixel inside
  its text line boxes (or icon box). In focus states the focus outline is
  also hidden in this capture, so text is compared with what is behind it.
- **Scroll positions:** the app background is a fixed photo, so default
  states were captured at up to 5 scroll positions across the range where
  the element is fully visible below the sticky nav.
- **Gradient text:** three captures per position — normal, background only,
  and the gradient painted over the whole text box. Pixels where the normal
  capture equals the painted gradient are fully covered glyph pixels; each
  is paired with the background pixel at the same position.
- **Hover:** a real mouse move over the card / close button. **Focus:** a
  real Tab key press followed by focusing the element; `:focus-visible` was
  confirmed active for every focus measurement. Outline colour is compared
  with the ring of pixels it occupies, captured with the outline hidden.

## Limitations

- One browser engine (Chromium/Edge) and two viewport sizes; other widths,
  zoom levels and Windows/forced-colour modes were not measured.
- Fixed-background pages were sampled at up to 5 scroll positions, not
  every position. The hero image is not fixed, so it is fully covered.
- Text measurements use whole line boxes, which include space between and
  around glyphs; this is conservative (it can only lower the minimum).
- Anti-aliased glyph edges are excluded from gradient text (only fully
  covered glyph pixels are paired), so its figures describe glyph interiors.
- In focus states, the focus ring's rounded corner overlaps the bottom-right
  corner of the nav subtitle's line box (not the letters). Those ring pixels
  were excluded by hiding the outline in the background capture; the ring
  itself is measured separately as "logo link focus outline".
- Nav subtitle hover/focus were measured on Home only; its colour and
  the nav background do not change with those states.
- Progress page "Aihe" labels: measured for topics 01 and 10 only (same
  component and colour as the Topics page, where all ten were measured).
- Only the elements that failed the earlier full audit (plus two hero
  regression checks) were re-measured; other elements were not re-audited.
- Disabled controls (e.g. Edellinen on the first sentence) and decorative
  graphics are exempt under WCAG and were not changed.
