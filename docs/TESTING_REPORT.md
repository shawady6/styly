# Styly Phase 1 — Testing Report

Build under test: branch `feature/phase-1-ui-redesign`, served over HTTP and driven by Playwright (Chromium, 390×844 unless noted).
Status meanings: **PASS** = executed and verified by a script in `tests/phase1/`; **FAIL** = executed and failed; **NOT TESTED** = could not be executed in this environment (never claimed as passed).

## 1. Automated functional suite (`tests/phase1/p1_suite.py`)

| ID | Check | Status |
|---|---|---|
| T01 | No console/page errors in the whole run | PASS |
| T02 | IndexedDB name/version/stores/keyPath unchanged | PASS |
| T03 | Add item from image saves record with legacy fields | PASS |
| T04 | Auto color name for navy shirt = كحلي; colorAuto stored; no colorName when equal | PASS |
| T05 | User name correction stored on record; original extraction preserved | PASS |
| T05b | Wardrobe shows the corrected name | PASS |
| T06a | Correction stored as one local learning sample | PASS |
| T06b | Same color later auto-named from learning (colorName saved, no manual step) | PASS |
| T06c | Learning does not generalize: red shirt unaffected | PASS |
| T07a | Edit sheet prefilled | PASS |
| T07b | Edit keeps id, image, added; updates fields | PASS |
| T08a | Learning info reflects state after restore without colorLearning | PASS |
| T09 | Saving without a photo shows inline error and writes nothing | PASS |
| T10a | Delete asks confirmation in accessible dialog | PASS |
| T10b | Cancel keeps item | PASS |
| T11a | Search by name | PASS |
| T11b | Filtered-empty state with working clear | PASS |
| T11c | Clear restores grid | PASS |
| T11d | Type filter | PASS |
| T11e | Occasion filter | PASS |
| T12a | Missing outer slot shows add-with-type placeholder | PASS |
| T12b | Add from missing slot preselects type | PASS |
| T12c | Score ring shown after shuffle | PASS |
| T12d | "Best for the rest" works | PASS |
| T12e | Occasion filter in mix | PASS |
| T13 | Outfit saved once; duplicate combination blocked | PASS |
| T14a | Plan: assign outfit | PASS |
| T14b | Plan: clear day | PASS |
| T14c | Plan: fill empty days | PASS |
| T14d | Week navigation | PASS |
| T15a | Saved outfit collage card rendered | PASS |
| T16a | Dark theme persists after reload (explicit, not media query) | PASS |
| T16b | System mode follows OS scheme | PASS |
| T16c | Explicit Light overrides OS dark | PASS |
| T17a | Backup JSON keeps v1 format keys | PASS |
| T17b | Restore asks confirmation before replacing | PASS |
| T17c | Cancel restore keeps current data | PASS |
| T17d | Restore of legacy-format backup: items/outfits/plan identical incl. ids | PASS |
| T17e | Legacy items (no colorName) render with palette names | PASS |
| T18a | Escape closes the sheet | PASS |
| T18b | Focus returns to opener after closing sheet | PASS |
| T19 | Visible controls have accessible names (wardrobe tab) | PASS |
| T20 | Click every visible button on every screen: no JS errors | PASS |
| T21 | Reduced motion disables sheet animation | PASS |
| T22 | Offline reload works (service worker cache) | PASS |
| T23 | No horizontal overflow at 320/360/390/430/768/1280 on all screens | PASS |
| T24 | Logo/icon/splash assets byte-identical to main | PASS |

Result: **47 / 47 PASS**, 0 FAIL.

## 2. Data survival across an upgrade (`tests/phase1/p1_survival.py`)

Data was created with the **previous build from `main`** (4 items, 1 outfit, 1 planned day, learned `styly-prefs`) in a persistent browser profile, then the **new build** was served on the same origin and profile.

| Check | Status |
|---|---|
| Old build really rendered the old UI before the upgrade | PASS |
| First launch after update shows the new UI (old service worker replaced; page reloads itself once) | PASS |
| Second launch shows the new UI | PASS |
| Full dump of IndexedDB (`items`, `outfits`, `plan`, DB version) + `styly-prefs` + `styly-last-backup` is byte-identical before/after | PASS |
| Wardrobe / Saved outfits / Planner render the old records (4 / 1 / 1) | PASS |
| Mix score works on legacy items | PASS |
| Editing a legacy item (no `colorAuto`) and saving keeps item count and works | PASS |

A real bug was found and fixed by this test: with the old cache-first service worker, the new worker pre-cached stale files from the browser HTTP cache and kept serving the old UI. The new worker now fetches with `cache:'reload'`/`no-store`, takes control immediately, and reloads open pages once when it replaces an older Styly cache.

## 3. Scoring unchanged (`tests/phase1/p1_score_eq.js`)

* The source from `/* known color pairings */` to the end of `outfitScore` is **textually identical** to v1.2 — PASS.
* 20,000 random outfits executed through old and new code: for the 18,140 whose colors keep the same canonical names, **0 score/note mismatches** — PASS.
* The other 1,860 samples contain a color that the expanded palette now names differently (e.g. near-white → "أوف وايت" maps to canonical "أبيض"; light blue → "أزرق فاتح" maps to "سماوي"). That is the requested palette expansion, not a scoring change.

## 4. NOT TESTED (cannot be done in this environment)

| Area | Why | Status |
|---|---|---|
| Native camera / gallery via Capacitor Camera plugin on a real Android device | no device; only the web file-input fallback was executed | NOT TESTED |
| Native backup export (Filesystem + Share sheet) and restore picker on Android | no device; the web download path was executed (T17) | NOT TESTED |
| Installing the new APK over an existing install (signature continuity, data kept) | needs a device; CI verifies the signing-certificate fingerprint only | NOT TESTED |
| Service-worker unregister on the native WebView (`Capacitor.isNativePlatform`) | native runtime not available | NOT TESTED |
| Screen reader (TalkBack) behaviour, real touch ergonomics | no device; only automated name/label/focus checks were run (T18, T19) | NOT TESTED |
| Font rendering and performance in Android System WebView | only Chromium desktop engine used | NOT TESTED |
| Color extraction on real garment photos | only synthetic garment images were used; extraction code is unchanged from v1.2 | NOT TESTED (real photos) |

## 5. Re-run

```
cd www && python3 -m http.server 8765 &      # new build
python3 tests/phase1/p1_suite.py
python3 tests/phase1/p1_survival.py          # needs the old build in tests/phase1/.work/old (git show main:www/index.html, sw.js, manifest, icons)
node tests/phase1/p1_score_eq.js <old index.html> www/js/color.js
```

## 6. v1.4.0 additions (hoodie + in-app update) — `tests/v14/v14_suite.py`: 15 / 15 PASS

| ID | Check | Status |
|---|---|---|
| H1–H6 | Hoodie type, winter season default, wardrobe filter, hoodie chosen in the *top* slot (replaces the shirt), scored, saved outfits and Home featured outfit work with hoodies | PASS |
| U1–U2 | Launch check finds a newer release; Home card + settings dot; Settings shows version, size, button | PASS |
| U3 | Same version → "latest" message | PASS |
| U4 | Failed check: silent on launch, friendly error on manual check | PASS |
| U5 | Native flow with **mocked** Filesystem/FileOpener: downloads the release APK to cache, then opens the system installer with the APK MIME type; no service worker on native | PASS (mocked) |
| U0 | No page errors | PASS |

**NOT TESTED:** the real download + Android package-installer hand-off, the "install unknown apps" permission prompt, and `REQUEST_INSTALL_PACKAGES` / `versionCode` injection in the CI-generated Android project (verified only by the workflow's own grep guards when CI runs). These need a device.

Phase 1 suite (47/47) and survival test were re-run on this build: PASS. Note: the survival script now back-dates the old files; otherwise `If-Modified-Since` made the local test server answer 304 for the new files (a test artifact).
