# Styly Design System (Phase 1)

Evolution of the existing identity, not a replacement: **tailor's tape** (yellow, controlled accent), **denim blue**, warm **ivory** surfaces, deep charcoal text. The logo, app icon, splash and the header wordmark/tape are frozen (see Technical Report §Logo).

All values live in `www/css/styles.css` as CSS variables. Components never hard-code colors, sizes, radii or shadows.

## Color tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#faf7f0` ivory | `#12141a` | page background |
| `--surface` | `#ffffff` | `#1a1d25` | cards, inputs, nav |
| `--tile` | `#efeadd` | `#232733` | image placeholders, quiet fills |
| `--ink` | `#1c1f26` charcoal | `#eef0f4` | primary text |
| `--muted` | `#646a75` | `#9aa1ae` | secondary text |
| `--line` / `--line-strong` | `#e6e0d1` / `#cfc8b6` | `#2a2f3b` / `#3a4151` | subtle borders / control borders |
| `--primary` | `#27407a` denim | `#3f5fb0` | primary buttons, selected states |
| `--link` | `#27407a` | `#9db3f2` | text links, focus ring, active nav |
| `--accent` | `#f4c20d` tape yellow | same | tape strip, active-nav bar, step badges, today marker. **Never** used as a large fill or button |
| `--danger` | `#b3261e` | `#ff8a80` | destructive actions, backup reminder dot |
| `--ok/warn/bad-*` | green/amber/red tints | tinted for dark | score pills and gauge |

Contrast: body text ≥ 12:1, `--muted` ≥ 5:1 on `--bg` in both themes; white on `--primary` ≥ 5.8:1 in both themes.

## Themes
Light / Dark / System. Chosen in **Settings → المظهر**, stored in `localStorage["styly-theme"]` (`light` | `dark`; absent = System). An inline script in `<head>` sets `data-theme` on `<html>` before first paint (no flash). System mode follows `prefers-color-scheme` through the same tokens; an explicit choice always wins over the OS.

## Typography
**IBM Plex Sans Arabic** (SIL OFL 1.1), bundled in `www/fonts/` (woff2, Arabic + Latin subsets, weights 400/500/600/700, ~280 KB total, works offline). Scale: 11 / 12 / 13.5 / 15 / 17 / 21 / 27 px; line-height 1.55. The "Styly" wordmark keeps its original font stack and is not affected by the UI font.

## Spacing, shape, elevation
* 4-pt grid: `--sp-1…7` = 4, 8, 12, 16, 20, 28, 40 px; page gutter 16 px (20 px ≥ 600 px).
* Radii: 6 (images) · 10 (controls/cards) · 14 (sheets, dialogs) · pill (chips). Nothing is heavily rounded.
* Elevation: borders first. `--sh-float` is used only for floating layers (sheet, dialog, toast). No gradients except the tape ruler pattern.
* Layout: content column `max-width: 720px`, centered on tablet/desktop; bottom nav 62 px + safe-area.

## Components
* **Header**: wordmark + tape (frozen), settings icon button (red dot when a backup is due), contextual "قطعة +" pill on the wardrobe.
* **Bottom nav**: Home · Wardrobe · Builder · Saved · Week; active = denim label + yellow tab mark; `aria-current="page"`.
* **Buttons**: `.btn` (primary), `.btn.ghost`, `.btn.dan`; min height 48 px (44 px small). **Chips/tabs**: underline tabs for type/occasion, pill chips for filters.
* **Tiles**: 4:5 image, 1 px border, name + color dot + `color · occasion`. Cut-out PNGs use `contain` with padding.
* **Score**: ring gauge (green ≥ 75, amber ≥ 55, red below) + pill + one-line reason.
* **Builder board**: 2×2 slots (top, bottom, jacket, shoes) with image, color name, prev / best-for-rest / next. Missing required slot = amber border + dashed placeholder with "+ add" that opens Add with the type preselected.
* **Sheet**: bottom sheet (centered dialog ≥ 600 px), `role=dialog aria-modal`, focus moved in, trapped, restored on close, Esc closes; sticky action footer.
* **Confirm dialog**: `role=alertdialog`, replaces `window.confirm` (used for delete item/outfit, restore, clear learning).
* **Toast**: top of the screen (never covers sheet actions), `role=status`.
* **Icons**: inline SVG line set (24 px grid, 1.7 stroke, `currentColor`); no emoji.
* **Empty states**: icon + title + one sentence + one action (wardrobe, filtered-empty, saved outfits, home onboarding).

## Accessibility
Visible `:focus-visible` ring; ≥ 44 px targets on nav/buttons/chips-in-sheet; all inputs labelled; `prefers-reduced-motion` removes all animation; RTL logical properties throughout.

## Color naming palette
~40 display names, including: كحلي (navy), أزرق ملكي, أزرق دنيم, سماوي, أزرق فاتح, فحمي, أسود, أوف وايت, كريمي, بيج, جملي, بني, زيتي, كاكي, بوردو, نبيذي, خردلي, وردي مغبر, لافندر, رمادي. Extra display names map to existing *canonical* names so the pairing rules keep working unchanged.
