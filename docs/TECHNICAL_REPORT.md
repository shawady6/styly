# Styly Phase 1 — Technical Report

Branch: `feature/phase-1-ui-redesign` → PR to `main` (not merged). Version `1.2.0 → 1.3.0`.

## Scope delivered
Premium UI/UX redesign + brand evolution: design tokens, bundled Arabic font, Light/Dark/System themes, SVG icons, new Home dashboard, redesigned Wardrobe (search + filters), Add/Edit (with new edit capability and color-name correction), Outfit Builder, Saved Outfits, Weekly Planner, Settings (theme, backup/restore, learning reset), accessible dialogs. **Not** implemented (Phase 2+): AI stylist, outfit intelligence, weather, try-on, analytics, shopping, cost-per-wear, paid APIs, cloud sync.

## Code structure
| Before | After |
|---|---|
| `www/index.html` (874 lines: markup + CSS + JS) | `index.html` (markup) · `css/fonts.css` · `css/styles.css` (tokens + components) · `js/core.js` (constants, icons, theme, IndexedDB, sheet/confirm/toast) · `js/color.js` (palette, naming, learning, scoring) · `js/screens.js` (all screens) · `js/app.js` (settings, backup, init) |

Plain classic scripts, no framework, no bundler, no new runtime dependency. The only added assets are the font files (`www/fonts`, ~280 KB). `fonts/OFL-LICENSE.txt` ships with them.

## Data integrity (the hard constraint)
* IndexedDB name `wardrobe`, version **2**, stores `items` / `outfits` / `plan` (keyPath `date`) — `openDB` is unchanged; **no migration**, no schema bump.
* Existing records are never rewritten on load. localStorage keys `styly-prefs`, `styly-last-backup` unchanged. Added keys: `styly-theme`, `styly-color-learning`.
* New **optional** item fields (old records simply lack them and render via the palette): `colorAuto {hex,label,source}` (original extraction, preserved on edit) and `colorName` (display name when the user corrected it or learning applied; absent when it equals the palette name). `color` (hex) remains the single source for scoring.
* Backup JSON stays `{app:'styly', v:1, …items, outfits, plan, prefs}`; `colorLearning` is an optional extra key. Old backups (without it) restore correctly (tested). Restore still asks for confirmation before replacing data.
* Verified by `tests/phase1/p1_survival.py`: data created by the `main` build is byte-identical after switching to the new build on the same origin.

### Behavior changes to be aware of
1. **Deleting an item** now also deletes any saved outfit that becomes *empty* (and its planner entries). Previously an empty outfit card could remain. Outfits that still have other pieces are kept (item id removed), as before.
2. The item delete / outfit delete / restore confirmations use an in-app accessible dialog instead of `window.confirm`.
3. Palette expansion can rename some existing colors on display (e.g. a near-white that was "كريمي" may now read "أوف وايت"); stored records are not modified. Scoring uses canonical names, so rules still apply.

## Scoring logic: unchanged
`RULES`, `pairScore`, `outfitScore`, `prefs`/`learn`, `recentItems`, `domColor` are copied verbatim from v1.2 (sed-extracted, not retyped). `tests/phase1/p1_score_eq.js` proves identical source text and 0 mismatches over 20,000 random outfits (see Testing Report).

## Color naming & learning
* `PAL` rows are `[canonicalName, hex, tag, displayLabel?]`. Added display names (أوف وايت, أزرق دنيم, أزرق فاتح, نبيذي, وردي مغبر) reuse canonical names so no rule changes.
* New item: extraction (k-means, unchanged) → `autoName(hex)` = nearest learned sample within ΔE76 ≤ 7, else nearest palette color (Lab). UI shows swatch, detected name, source ("اتاخد من الصورة" / "اتعلّمه من تصحيحاتك" / …), a name `<select>` (palette names + learned custom names + "اسم آخر…" free text), quick swatches, native color input, and tap-on-photo sampling.
* Learning: only a real correction creates one sample `{lab,label}` in `localStorage["styly-color-learning"]`; a newer correction replaces samples within ΔE 2.5; max 300; radius 7 prevents over-generalization (a navy correction does not rename red — tested). Applies only to **new** auto-naming; existing records never change retroactively. Reset in Settings.

## Service worker & update behavior
Old worker was cache-first (`styly-v2`) → an updated web layer could be hidden. New `sw.js` (`styly-v3`): network-first with `cache:'no-store'`, `skipWaiting`, `clients.claim`, deletes old caches, and reloads open pages once when it replaces an older Styly cache. On the Capacitor app the web files ship inside the APK, so the page unregisters any service worker there. The upgrade path found and fixed a real stale-UI bug during testing (HTTP-cache heuristics served old files to the new worker).

## Logo and brand assets
Untouched: `www/icon-192.png`, `icon-512.png`, `resources/android/**` (launcher icons, adaptive background, splash) are byte-identical to `main` (test T24 compares hashes). The header wordmark (`.logo`) keeps its exact original CSS and font stack (now explicitly pinned so the new UI font cannot change it); the tape ruler pattern is the same, only its colors are tokens.

## Accessibility
Dialog roles, focus trap/restore, Esc, labelled controls, `aria-current/aria-pressed/aria-selected`, `role=status` toast, visible focus ring, reduced-motion support, 44 px targets, RTL logical properties.

## CI
Workflow now builds `feature/**` branches too (preview artifact only; the public `latest` release is still published from `main` only, with the signing-certificate fingerprint guard).

## Known limitations / risks
* Native camera, native share/backup, APK upgrade-in-place, TalkBack and Android WebView rendering were **not** testable here (see Testing Report §4). Please run the preview APK artifact on a device before merging.
* The first launch after updating from v1.2 may flash the old UI once and reload itself (service-worker replacement); data is unaffected.
* Learning is per-device and not synced (cloud sync is out of scope).
* A name chosen through correction is display-only: scoring still derives from the hex color, by design (scoring unchanged).
