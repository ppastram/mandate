# SOURCES.md — mandate

## What this project is
Mandate is a civic poll on AI policy. The world map and country profiles are built from third-party sources; the "what people want" layer and voter dots are built from anonymous poll responses collected in the app.

## Data sources

| Source | Covers | License | Nature of data |
|---|---|---|---|
| [AI Regulation Map](https://airegulationmap.org) ([repo](https://github.com/riadeane/airegulationmap)) | Regulation status and enforcement, promotion / economic tools, policy levers, key laws | GPL-3.0 | **LLM-assigned.** Scores are produced by an AI research pipeline and refreshed weekly. Snapshot used: 2026-10-06. A higher score means more is in force — not better policy. |
| [Government AI Readiness Index 2025](https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/) (Oxford Insights) | 6 pillar scores and rank for 195 countries | All rights reserved; cite as source | Parsed from the Full Rankings table of the corrected report. No overall score is published. |
| [ILIA 2025](https://www.cepal.org/es/publicaciones/82514-indice-latinoamericano-inteligencia-artificial-ilia-2025) (CEPAL / CENIA) | Total AI ecosystem score for 19 countries | Copyright United Nations 2025, all rights reserved; cite as source | Total only, 0–100 scale. Measures the whole AI ecosystem, not only public funding. |
| [Natural Earth 110m](https://www.naturalearthdata.com/) via [world-atlas](https://github.com/topojson/world-atlas) | World country geometry | Public domain | TopoJSON, Antarctica filtered. |

## How the two axis scores are built
Both `gov_profile.regulation` and `gov_profile.promotion` are **percentiles 0–100 within the full set of countries** — not raw indicator values.

- `gov_profile.regulation` — composite of
  - `regulation.status` (AI Regulation Map)
  - `oxford_2025.governance` (Oxford Insights)
- `gov_profile.promotion` — composite of
  - `promotion.economic_tools` (AI Regulation Map)
  - `oxford_2025.promotion_composite = mean(policy_capacity, ai_infrastructure, development_diffusion)` — an **own composite**, not an Oxford figure

Each country also carries a `confidence` field (low / medium / high) reflecting how many independent sources contributed.

## Vote storage
Vote responses are stored anonymously in Supabase (`responses` table, RLS on, no public read). A random UUID in `localStorage` identifies the device; `submit_response()` upserts by `device_id`. Aggregates come from `country_results()`, which withholds per-statement and per-axis averages until at least 30 responses exist for a country.

Policymaker contacts (`contacts` table) are written through `submit_contact()`, with no public read either.

## Limits that must be stated on the method page
1. **The sample is self-selected and does not represent any country.** No sampling frame, no quota, no weighting. Comparisons across countries are informative at best.
2. **One response per device can be bypassed.** The uniqueness constraint is on a UUID stored in `localStorage`; a determined user can clear storage or switch browsers. Treat vote counts and averages as a floor, not a ground truth.
3. **Country scores (`gov_profile.*`) are percentiles among 195 countries, not absolute figures.** A score of 67 means "higher than 66% of countries on this axis", not "67 out of 100 points of policy".
4. **AI Regulation Map inputs are produced by an AI research pipeline.** Classifications are automated and may miss nuance; weekly refreshes correct over time. The pipeline is open source at the AI Regulation Map repository above.

## Files
| Path | Content |
|---|---|
| `data/map_data.json` | Source of truth, hand/LLM-authored. 520 KB. |
| `data/countries-110m.json` | Natural Earth 110m TopoJSON. 108 KB. |
| `public/data/countries.min.json` | Generated slim index (iso3, iso2, numeric, name, gov_profile, confidence) — loaded eagerly. |
| `public/data/country/<ISO3>.json` | Generated detail (key_laws, sources, notes) — loaded on demand. |
