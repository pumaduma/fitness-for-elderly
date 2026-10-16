# 樂齡健體 Fitness for the Elderly — Website

Production-ready, bilingual (繁體中文 / English) multi-page website for a Hong Kong
elderly fitness NGO. Built with **Vite + vanilla JavaScript** — only two runtime
dependencies (`vite`, `leaflet`). No backend: bookings, tracker data, applications
and preferences persist in `localStorage`; content lives in mock JSON-style modules.

---

## Quick start

```bash
npm install        # install dependencies
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build → http://localhost:4173

npm run verify     # static checks: all i18n keys resolve in BOTH locales
                   # + N-body physics stability simulation (3000 frames)
npm run qa         # end-to-end browser tests (needs Google Chrome installed):
                   #   56 checks — sim, language toggle, a11y toolbar,
                   #   search, booking, wizard, health tools, map, forms
npm run reports    # regenerate the three PDF publications in public/reports/
```

`node scripts/qa.mjs` uses `puppeteer-core` with the locally installed Chrome at
`/Applications/Google Chrome.app/...` — adjust `CHROME` in the script if needed.

---

## Pages (all real routes)

| Route | File | Highlights |
|---|---|---|
| `/` | `index.html` | Hero with **N-body simulation**, mission, steps, program highlights, **founding team** (Zi Chi, Daniel Chua, Adrian Preston Wong), news teaser |
| `/programs` | `programs.html` | 8-program catalog, live search + category filters, deep-link `#program-id` |
| `/schedule` | `schedule.html` | Weekly timetable, center filter, week navigation, **booking modal**, my-bookings (localStorage) |
| `/centers` | `centers.html` | Leaflet + OpenStreetMap, 6 district markers, accessible card list |
| `/membership` | `membership.html` | 4-step wizard: eligibility check → details → programs → review → success |
| `/volunteers` | `volunteers.html` | 4 role cards + validated application form |
| `/donate` | `donate.html` | Tiered HKD giving, one-off/monthly, FPS/card/cheque (demo), tax note |
| `/health-tools` | `health-tools.html` | BMI calculator, 4-question fall-risk quiz, weekly activity tracker |
| `/about` | `about.html` | First-year goals, founding story, **founding team**, 3 PDF publications, cited HK stats |
| `/contact` | `contact.html` | Hotline/WhatsApp/email, validated form, FAQ accordion |
| `/news` | `news.html` | Listing + full article view, deep-linkable `#article=<slug>` |

Clean-URL aliases (`/programs` → `/programs.html`) are configured in `netlify.toml`;
`vercel.json` uses `cleanUrls`.

---

## Project structure

```
├── index.html … news.html        # 11 route entry points (Vite MPA)
├── vite.config.mjs               # multi-page input config
├── netlify.toml / vercel.json    # deploy configs
├── public/
│   ├── favicon.svg  og-image.svg  robots.txt  sitemap.xml
│   └── reports/                  # 3 generated PDF publications (overview, prospectus, plan)
├── scripts/
│   ├── make-reports.py           # dependency-free PDF generator
│   ├── verify.mjs                # i18n key coverage + physics stability
│   └── qa.mjs                    # puppeteer end-to-end test suite
└── src/
    ├── styles/                   # base.css (tokens) components.css pages.css
    ├── locales/zh.js  en.js      # ALL site copy (mirrored key structure)
    └── js/
        ├── main.js               # shared shell: header/nav/footer, a11y toolbar, lang toggle
        ├── i18n.js               # tiny i18n engine (data-i18n attributes)
        ├── data.js               # programs, centers, 3 founders, news, schedule rules, goals, HK stats
        ├── nbody.js              # the N-body simulation (see tuning below)
        ├── modal.js              # accessible dialog helper
        ├── booking.js            # class booking + localStorage
        ├── map.js                # Leaflet map
        └── home/programs/schedule/membership/volunteer/donate/
            health/about/contact/news.js   # one module per page
```

---

## How to add a new program

1. **`src/js/data.js`** — append an entry to `PROGRAMS`:
   ```js
   { id: 'dance-for-health', category: 'social', intensity: 'low',
     icon: '💃', tags: ['cardio', 'social'], duration: 60 },
   ```
   `category` must be one of `fall | taichi | aqua | strength | social`
   (their labels live in `programs.categories.*`). `tags` keys map to `programs.tags.*`.
2. **`src/locales/zh.js` and `src/locales/en.js`** — add `programs.items['dance-for-health']`
   with `name`, `tagline`, `desc`, `suitable`, `when`, `where` (mirror both files).
3. *(Optional)* Add it to a center's `programs` array in `CENTERS` and a
   `SCHEDULE_RULES` entry (`{ program, days, time, capacity, instructor }`) so it
   appears in the timetable.
4. Rebuild — the catalog, schedule and highlights pick it up automatically.

## How to add a news article

1. `src/js/data.js` → `NEWS` push `{ slug, category }`.
2. Both locales → `news.items[slug]` with `title`, `excerpt`, `date`, `author`,
   `category`, and `body` as blocks: `{type:'p'|'h2'|'quote'|'ul', text|items}`.
3. The listing, teaser and deep link `/news.html#article=<slug>` work immediately.

## How to tune the N-body simulation

All knobs are in **`src/js/nbody.js`**, top of file:

```js
export const CONFIG = {
  G: 0.048,          // gravity strength — higher = tighter, faster system
  damping: 0.9992,   // velocity loss per frame — lower = calmer, faster decay
  bodyCount: 80,     // total bodies (3 founders + 77 future members)
  trailLength: 12,   // glowing trail points per body
  centerMass: 2600,  // mass of the Community Center attractor
  softening: 900,    // distance² softening (prevents near-collision singularity)
  maxSpeed: 4.5,     // velocity cap
};
```

- **Orbits too wild?** Lower `G`, raise `damping`.
- **Want a denser "family" look?** Raise `centerMass` and/or `G` together.
- **More bodies?** Bump `bodyCount` (only the first 3 are the named founders).
- The loop is O(N²) ≈ 3,200 force pairs/frame at N=80 — far below the 60 fps budget
  on any laptop. `npm run verify` re-checks stability after you change values.
- `prefers-reduced-motion` (or the toolbar's ✦ toggle) swaps the animation for a
  static constellation; the sim exposes `play / pause / reset`.

## Accessibility notes

- Base font 18px, minimum 48px tap targets, visible 3px focus ring everywhere.
- Toolbar (bottom-left): A−/A+, ◐ high contrast, ✦ reduce motion, ↺ reset —
  persisted in `localStorage` and applied **before first paint** (inline `<head>` script).
- All text contrast ≥ 4.5:1 (buttons ≥ 5.1:1), non-text UI ≥ 3:1 — see
  `ACCESSIBILITY-AUDIT.md` for the full WCAG 2.1 AA audit with computed ratios.
- Interactive map is duplicated as an accessible card list; charts have hidden
  data tables; the sim canvas is keyboard-operable (focus + Enter/Space).
- The health tools include medical disclaimers — they never replace professional advice.

## Deployment

- **Netlify:** drag the repo in (build `npm run build`, publish `dist`), or
  `netlify deploy --prod`. `netlify.toml` is included.
- **Vercel:** import the repo; `vercel.json` is included.
- Tiles come from OpenStreetMap and fonts from Google Fonts (with system-font
  fallback) — both need internet at runtime; everything else is fully static.

## Publishing & getting indexed by Google

### 1. Get a public URL
Drag the prepared zip (or the `dist/` folder) onto <https://app.netlify.com/drop>.
Then **claim the site** with a free account and rename it — e.g. to `ffe-hk` so the
URL becomes `https://ffe-hk.netlify.app`. (Unclaimed drops are temporary.)

### 2. Rebuild with that URL
```bash
SITE_URL=https://ffe-hk.netlify.app npm run build
```
This automatically adds to every page a `<link rel="canonical">`, `og:url` and an
absolute `og:image`, and writes `dist/sitemap.xml` (11 URLs) + `dist/robots.txt`
pointing at your domain. Re-drop the new `dist/` to publish it.
Without `SITE_URL` the build still works, but prints a reminder and skips the
sitemap/canonical tags.

### 3. Get into Google (Search Console)
1. Go to <https://search.google.com/search-console> → **Add property** →
   **URL prefix** → enter your full URL.
2. **Verify ownership** with the *HTML tag* method: copy the token from Search
   Console, then rebuild — the token is injected automatically:
   ```bash
   SITE_URL=https://ffe-hk.netlify.app \
   GOOGLE_SITE_VERIFICATION=your-token-here npm run build
   ```
   Re-drop `dist/`, then click **Verify**.
3. **Sitemaps** → submit `sitemap.xml`.
4. **URL Inspection** → paste each page → **Request indexing** (a few per day).
5. Check progress by searching `site:your-url` on Google. Indexing a brand-new
   site typically takes **days to a few weeks**, and Google decides what to index.

> A custom domain (e.g. `fitnessfortheelderly.org`, roughly HK$80–150/year) is
> recommended for an organisation: it looks credible to donors, allows a DNS
> **Domain property** in Search Console (no rebuild needed to verify), and gives
> you a permanent address independent of Netlify.

## Notes & disclaimers

- This is a **demonstration build**: donation payments, booking confirmations and
  form submissions are simulated and stored in `localStorage` (keys `ffe-*`).
  Swap the `save()` calls for your API when a backend exists.
- Figures on the About page are real, sourced statistics (CHP/DH/C&SD/WHO/CUHK/HKU)
  — see the citations on the page and `hk-elderly-health-fitness-stats.md`.
- The organisation is **newly founded and currently has no members**: the About
  page shows clearly-labelled first-year *goals*, and the N-body sim's lights
  represent future members. The three founders (Zi Chi, Daniel Chua, Adrian
  Preston Wong — juniors at Hong Kong International School) are the only named
  people on the site.
- `sitemap.xml`/`robots.txt` use the placeholder domain `www.ffe.org.hk` — replace
  with the real domain before launch.
