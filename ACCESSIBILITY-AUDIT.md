# Accessibility Audit — WCAG 2.1 AA

Audit scope: the three most-used pages — **Home** (`index.html`),
**Programs** (`programs.html`), **Schedule** (`schedule.html`) — with the shared
shell (header, nav, footer, accessibility toolbar) that appears on every page.
All contrast ratios below are computed with the WCAG relative-luminance formula.

**Result: PASSES WCAG 2.1 AA** for the criteria checked. One item (Leaflet tiles)
is listed as an external-service note.

---

## 1. Perceivable

### 1.4.3 Contrast (Minimum) — text ≥ 4.5:1 (3:1 for large text)

| Element | Foreground | Background | Ratio | Status |
|---|---|---|---|---|
| Body text | `#1D2320` | `#FFF8F0` | ≈ 13.0:1 | ✅ |
| Secondary text | `#3C4744` | `#FFF8F0` | ≈ 9.2:1 | ✅ |
| Headings / links | `#0F5C5C` | `#FFF8F0` | ≈ 7.4:1 | ✅ |
| Primary button text | `#FFFFFF` | `#C1441F` | 5.1:1 | ✅ |
| Primary button hover | `#FFFFFF` | `#9E3013` | 7.2:1 | ✅ |
| Secondary button text | `#FFFFFF` | `#0F5C5C` | 7.8:1 | ✅ |
| Footer text | `#FFFFFF` / `#F2A93B` | `#073434` | ≈ 13.4:1 / 6.8:1 | ✅ |
| Hero stat value | `#F2A93B` | `#073434` | 6.8:1 | ✅ |
| Badge (coral) | `#9E3013` | `#FDE7E0` | 6.1:1 | ✅ |
| Badge (gold) | `#8A5A00` | `#FDF3DD` | 5.4:1 | ✅ |
| Field error text | `#B3261E` | `#FFF8F0` | ≈ 6.2:1 | ✅ |
| Class-time text | `#C1441F` | `#FFFFFF` | 4.8:1 | ✅ |
| Wizard active chip | `#9E3013` | `#FDEEE8` | 6.4:1 | ✅ |
| Sim legend (dark bg) | `#DCE8E6` | `#06201F` | ≈ 10:1 | ✅ |

> Design decision: pure brand coral `#E8613C` is **3.4:1 against white**, so it is
> used only for large decorative accents and large text (≥24px, where 3:1 suffices).
> Any place it carries normal-size text uses the darker coral tones above.

### 1.4.4 / 1.4.10 Resize & Reflow
- Base font size 18px; toolbar steps 100% → 137.5% via `rem` scaling.
- At 400% zoom (equiv. 320px CSS width) the layout collapses to one column
  (`auto-fit` grids + `minmax()`); no horizontal scrolling required on audited pages.
- Verified at 390px and 1440px viewports in the QA suite.

### 1.4.11 Non-text Contrast — UI components ≥ 3:1
- Input/select borders `#8A7A68` on `#FFF8F0`/white ≈ 4.2:1 ✅
- Primary button on the dark hero: white 2px border added (13.4:1) ✅
- Focus indicator `#1A5FB4` ≥ 5.9:1 against both backgrounds ✅
- Map markers: coloured pins on OSM tiles; the equivalent text list (below the
  map) is fully accessible ✅

### 1.4.12 Text Spacing — PASSES
No `line-height`, `letter-spacing` or `word-spacing` is set below the minimums
WCAG requires (1.5 / 0.12 / 0.16).

### 1.1.1 Non-text Content
- Every icon is either decorative (`aria-hidden="true"`) or has a text label.
- Map: duplicated as six accessible cards with address/hours/phone.
- N-body canvas: `role="img"` + descriptive `aria-label`; a hint paragraph
  explains the visual; the founders' profiles are duplicated in the
  keyboard-accessible founding-team cards on the same page.

### 1.3.1 / 1.3.2 Info & Relationships / Meaningful Sequence
- Semantic landmarks: `header/nav/main/section/article/footer`, one `h1` per page,
  ordered heading levels; forms use `label`, `fieldset/legend`; timetable columns
  are `role="group"` with weekday labels; table columns use `th scope`.

---

## 2. Operable

### 2.1.1 / 2.1.2 Keyboard
- Skip link is the first focusable element on every page.
- All controls are native `<button>/<a>/<input>` — no div-click hacks.
- Mobile hamburger, accordion FAQ, filter pills, sim controls, wizard, modals:
  fully keyboard operable. QA confirms `aria-expanded` state changes.
- Modals trap Tab, close on Esc, and restore focus to the trigger.
- N-body canvas is focusable; Enter/Space opens a founder profile.

### 2.4.7 Focus Visible
- Global `:focus-visible` 3px `#1A5FB4` outline with 3px offset on every
  interactive element — including nav links, filter pills and map markers.

### 2.5.8 Target Size (AA) — PASSES
- Minimum interactive height 48px (`--tap-min`), 56px for large CTAs;
  toolbar buttons are 48×48; small inline buttons 44px+.

### 2.2.2 Pause, Stop, Hide
- N-body autoplay is user-controllable (pause/reset buttons) and automatically
  becomes a static constellation under `prefers-reduced-motion` or the toolbar's
  ✦ toggle. No other autoplay/marquee content exists.

### 2.4.1 Bypass Blocks
- Skip link + single landmark structure per page.

---

## 3. Understandable

### 3.2.2 / 3.3.x Input Assistance
- Every form validates with inline, programmatically-associated error text
  (`aria-invalid` + `aria-describedby`) and screen-reader announcements via a
  polite live region.
- Booking: 8-digit HK phone validation; membership wizard: DOB (incl. future-date
  check), consent, district; donate: amount ≥ $10, email format; contact: phone
  OR email required.
- No unexpected context changes: language toggle and toolbar announce via
  `aria-live`, forms never auto-submit or auto-navigate.

### 3.1.1 Language of Page
- `<html lang="zh-Hant">` by default, switched to `en` on toggle; preference
  persisted and applied before first paint (no flash).

---

## 4. Robust

- Valid HTML5; ARIA used only where native semantics are insufficient
  (dialog, accordion, live regions, pressed states).
- `prefers-reduced-motion` honoured in CSS (all animation/transition overrides)
  and in the N-body engine.
- Status messages (booking success, form results, tool changes) are announced
  through a dedicated `role="status"` live region.

## External-service note
OpenStreetMap tiles and Google Fonts are third-party. Tile layer has full
attribution and the map content is duplicated accessibly; font stack falls back
to system CJK fonts offline. No WCAG failure results from either.

## Automated & manual checks performed
- `node scripts/verify.mjs` — 412 i18n keys × 2 locales, physics stability.
- `node scripts/qa.mjs` — 56 end-to-end checks in headless Chrome: keyboard
  focus order spot checks, `aria-expanded` assertions, form validation paths,
  persistence across reloads, mobile menu at 390px, 1440px desktop layout,
  zero console errors across all 11 pages.
- Manual: contrast computations above; reflow at 320/390/1440px; heading order
  per page; landmark structure.
