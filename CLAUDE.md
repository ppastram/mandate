# CLAUDE.md — mandate

## Project overview
Civic poll on AI policy. People vote on 6 statements (3 regulation + 3 promotion), see where their government stands on a quadrant chart, and their anonymous vote is counted for their country.

Read `README.md` before touching UI: it defines the visible design system. Read `docs/SPEC.md` for the full product spec, and `docs/SOURCES.md` for data provenance.

## Stack
- Vite 5 + React 18 (JavaScript, not TypeScript)
- `react-router-dom` for `/`, `/map`, `/method`, `/r?...`
- `d3-geo` + `topojson-client` for the Equal Earth world map
- `@supabase/supabase-js` for anonymous vote storage and policymaker contacts
- `@vercel/og` for per-result Open Graph image generation
- Deployed on Vercel (`vercel.json` rewrites `/r` to `api/share.js`)

Design system is defined in `README.md` (paper white, ink text, square corners, thin rules instead of cards, no shadows/gradients/emoji, Libre Franklin for text, IBM Plex Mono for small data labels, no em dashes). All visible UI must obey it. Tokens live in `src/styles/tokens.css`.

## Key paths
### Data
- `data/map_data.json` — source of truth (~520 KB, hand/LLM-authored). Never edit the generated files under `public/data/`.
- `data/countries-110m.json` — Natural Earth 110m TopoJSON (keyed by numeric ISO code, Antarctica = `"010"`).
- `scripts/build-data.mjs` — splits map_data into the slim index + per-country detail; also copies the topojson. Runs automatically on `npm run dev` and `npm run build`.
- `scripts/post-build.mjs` — bakes `dist/index.html` into `api/_template.js` so the share function can inject OG tags without touching the filesystem.
- `public/data/countries.min.json` — slim index (iso3, iso2, numeric, name, gov_profile, confidence). Eagerly loaded.
- `public/data/country/<ISO3>.json` — key_laws (array, split only on `),`), sources, notes. Lazy per country.
- `public/data/countries-110m.json` — topojson served to the browser.

### App
- `src/styles/tokens.css` — palette, type, spacing, zero radii.
- `src/i18n/` — ES/EN dictionary, 6 statements, LangProvider (persists in `localStorage['mandate.lang']`, falls back to browser).
- `src/state/QuizProvider.jsx` — the whole quiz state in `localStorage['mandate.quiz.v1']`; `device_id` UUID in `localStorage['mandate.device']`.
- `src/lib/supabase.js` — client (null when env vars are missing), `submitResponse()`, `fetchCountryResults()`, `submitContact()`.
- `src/hooks/` — `useCountries`, `useCountryDetail`, `useCountryResults`, `useTopology`, `useOgTags`.
- `src/components/` — `Header`, `Footer`, `Button`, `Tag`, `ProgressBar`, `AnswerOption`, `CountryPanel`, `CountryPicker`, `QuadrantChart`, `WorldMap`, `ContactModal`, `ResponseSubmitter`.
- `src/screens/` — `CountryPickerScreen` (step 0), `QuizScreen` (step 1), `ResultScreen` (step 2), `SharedResultScreen` (/r), `MapScreen` (/map), `MethodScreen` (/method).

### Serverless / infra
- `api/og.jsx` — Vercel Edge, generates the per-result 1200×630 PNG with `@vercel/og`.
- `api/share.js` — Vercel Node, serves `/r?...` with injected OG/Twitter/canonical meta tags for scrapers.
- `api/_template.js` — generated at build time, imported by `share.js`. In `.gitignore`.
- `vercel.json` — rewrites `/r` to `/api/share` and sets cache headers for `/api/og`.
- `supabase/migrations/*.sql` — `responses` + `contacts` tables, both RLS-on with no public read; access is only via `submit_response()`, `country_results()`, `submit_contact()` security-definer functions.
- `.env.example` — template for `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Copy to `.env.local` (git-ignored via `*.local`).

## Dev commands
```
npm install        # first time only
npm run dev        # build:data + Vite → http://localhost:5173
npm run build      # build:data + Vite build + post-build.mjs
npm run build:data # just regenerate public/data/
```
For OG previews locally use `npx vercel dev`. In Vite dev `/r?…` goes through React Router (no bot meta tags). In Vercel prod, `/r?…` is rewritten to `api/share.js` which serves the SPA shell with per-result OG tags.

## localStorage keys
- `mandate.quiz.v1` — `{ countryIso3, region, answers[6], currentQuestion, completed }`
- `mandate.lang` — `'es' | 'en'`
- `mandate.device` — UUID for Supabase upsert key
- `mandate.submitted` — hash of the last successfully submitted payload, to avoid duplicate submits across refreshes

## Rules for Claude
- Edit `data/map_data.json`, never the generated files under `public/data/`.
- Keep `data/map_data.json` and `data/countries-110m.json` in sync on country codes.
- `key_laws` is a free-text string; split only on `),`.
- `gov_profile.*` scores are percentiles among countries. Never subtract user from country, never show a match percentage.
- `country_results()` already withholds averages until n ≥ 30. Trust the function; do not gate client-side.
- Every data screen carries its source line.
- `docs/design/quiz.png` is a reference from the exploratory phase. The visual direction is defined by `README.md`, not that screenshot.
