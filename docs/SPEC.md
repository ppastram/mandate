# Mandate, product spec

## What it is
A civic poll. People say what their government should do about AI, then see where their government stands, and their anonymous vote is counted for their country.

Stack: Vite + React + TypeScript, Supabase, d3-geo + topojson-client, Vercel. No login.

## Routes
- `/` quiz and result
- `/map` world map
- `/method` sources, method and limits
- `/r?c=COL&reg=83&pro=42` shared result, read-only, with a "Vote" button

## Data (data/map_data.json, under "countries", keyed by ISO3)
- `name`, `iso2`, `numeric` (matches the shape `id` in countries-110m.json, a string with leading zeros)
- `gov_profile.regulation`, `gov_profile.promotion`: 0 to 100, the country's percentile among countries
- `key_laws`: one string. Split only where a closing parenthesis is followed by a comma.
- `promotion.note`: one sentence on public funding and incentives
- `sources`: list of URLs. `confidence`: high, medium or low.
Show country names with Intl.DisplayNames using `iso2`. Law names and notes stay in their original language.

## Step 0, country
- Searchable picker with every country in the data.
- Suggest a country from the browser locale. Never ask for location permission.
- For United States, Mexico, Brazil and Argentina, show an optional state or province picker. It is stored with the vote and not used in any score yet.

## Step 1, six statements, one at a time, with Previous and Next
Order is fixed. 1 to 3 are regulation, 4 to 6 are promotion.

1. ES: Debería prohibirse desarrollar IA más capaz que los humanos.
   EN: Developing AI more capable than humans should be banned.
2. ES: Las empresas de IA deberían responder legalmente cuando su modelo incita a un suicidio o ayuda a cometer un crimen grave.
   EN: AI companies should be legally liable when their model encourages a suicide or helps commit a serious crime.
3. ES: Debería ser obligatorio marcar las imágenes y videos hechos con IA.
   EN: Labeling AI-generated images and videos should be mandatory.
4. ES: Mi gobierno debería invertir dinero público en centros de datos y cómputo para IA.
   EN: My government should invest public money in data centers and compute for AI.
5. ES: Mi gobierno debería dar incentivos económicos a las empresas que adopten IA.
   EN: My government should give companies financial incentives to adopt AI.
6. ES: Mi gobierno debería pagar formación en IA para estudiantes y trabajadores.
   EN: My government should pay for AI training for students and workers.

Answers and their values:
| ES | EN | Value |
|---|---|---|
| Completamente en contra | Strongly disagree | 0 |
| En contra | Disagree | 25 |
| Neutro | Neutral | 50 |
| A favor | Agree | 75 |
| Completamente a favor | Strongly agree | 100 |

Next is disabled until an answer is chosen. No answer is preselected.

Progress bar: three blue segments (regulation) and three orange (promotion).

## Country panel, shown beside every statement
- Statements 1 to 3: blue panel with `gov_profile.regulation` as the big number, label "de 100 en regulación".
- Statements 4 to 6: orange panel with `gov_profile.promotion`, label "de 100 en fomento".
- Small world map shaded by that same score, selected country in yellow.
- One line: "El puntaje mide cuánto existe, sin juzgar si es bueno o estricto." / "The score shows how much is in place, not how good or strict it is."

## "What already exists" band, below the question
- Statements 1 to 3: first 4 items of `key_laws`, with a "show all" link. Tag an item "en trámite / in progress" only if its text contains pending, draft, proposed or bill. Other items get no tag.
- Statements 4 to 6: the `promotion.note` sentence.
- Source line: AI Regulation Map and Oxford Insights, with the country's `confidence`.

## Step 2, result
Scores, each rounded to a whole number:
- `user_regulation` = average of answers 1, 2, 3
- `user_promotion` = average of answers 4, 5, 6

Chart: a square plane. Horizontal axis is regulation, vertical axis is promotion, both 0 to 100, split at 50 into four labeled quadrants. Two dots:
- User: yellow #FFC800 with a black outline, at (`user_regulation`, `user_promotion`)
- Country: blue #1D3FD1, at (`gov_profile.regulation`, `gov_profile.promotion`)

Quadrants (50 or more counts as high):
| Regulation | Promotion | ES | EN |
|---|---|---|---|
| high | high | Acelerar con reglas | Build with rules |
| low | high | Acelerar sin trabas | Build freely |
| high | low | Frenar | Slow down |
| low | low | No intervenir | Hands off |

Special case: if the user's two scores are both exactly 50, their label is "Sin postura definida / No clear position".

Headline:
- ES: "Tú: {user quadrant}. {País}: {country quadrant}."
- EN: "You: {user quadrant}. {Country}: {country quadrant}."

Second line: "Están en el mismo cuadrante." / "You are in the same quadrant." or "Están en cuadrantes distintos." / "You are in different quadrants."

Below the chart, one row per axis showing both numbers with their own units:
- "Regulación. Tú: {n} de 100 de apoyo. {País}: percentil {n} entre 195 países."
- "Fomento. Tú: {n} de 100 de apoyo. {País}: percentil {n} entre 195 países."

Never subtract the user's score from the country's, and never show a match percentage. Always show this note:
- ES: "Tu puntaje es lo que quieres. El del país es su posición frente a otros países."
- EN: "Your score is what you want. The country's score is its position among other countries."

Buttons: "Compartir / Share" (Web Share API, falling back to copying the headline and link), "Ver el mapa / See the map", "Cambiar respuestas / Change answers", and "Soy formulador de política pública / I work in policy" (opens the contact form).

## Map screen
- Equal Earth projection, no Antarctica, shapes crossing the date line handled.
- Layer toggles:
  - Regulation: `gov_profile.regulation` in 5 equal bins, blues #DCE3FA #B3C1F3 #7F95EA #4A66DE #1D3FD1
  - Promotion: `gov_profile.promotion` in 5 equal bins, oranges #FBE3D6 #F4C2A6 #E8946A #D9662F #C4420A
  - Difference: promotion minus regulation. Below -15 strong blue, -15 to -5 light blue, -5 to 5 light grey, 5 to 15 light orange, above 15 strong orange.
  - What people want: added with Supabase, see below.
- No data: #E6E6E1. Selected country: yellow fill, black outline.
- Hover or tap shows the country name and both scores. Click selects it as the country.
- Legend from "menos que casi todos / less than most" to "más que casi todos / more than most".

## Storage
- localStorage: country, state, answers, language, and `device_id` (random UUID).
- Supabase table `responses`: id, device_id (unique), country_iso3, region, a1 to a6 (0, 25, 50, 75 or 100), lang, created_at, updated_at.
- Row level security on. Anonymous users cannot read or write the table directly.
- `submit_response(...)`, security definer: validates values and upserts by device_id. Called once after statement 6 and again if the user changes answers.
- `country_results()`, security definer: per country, the number of responses, plus averages per statement and per axis only when there are 30 or more responses.
- Table `contacts` for the policy form (name, institution, email, country), written through a security definer function, no public read.

## Using the votes
- Result screen: with 30 or more responses for the country, add a third dot (white fill, black outline) labeled "Votantes de {País}". With fewer, show "Eres el voto {n} de 30 para desbloquear {País}."
- Map layer "What people want": show the response count for every country, and color only countries at or above 30.

## Method page
Built from docs/SOURCES.md. Must state: the sample is self-selected and does not represent any country, one response per device can be bypassed, scores are percentiles, and AI Regulation Map scores are assigned by an AI research pipeline.

## Footer on every screen
"Datos: AI Regulation Map (GPL-3.0). Government AI Readiness Index 2025, Oxford Insights. ILIA 2025, CEPAL y CENIA. Mapa base: Natural Earth. Proyecto sin ánimo de lucro." Each name links to its site.

## Out of scope
Accounts, comments, city-level data, state-level maps, scores by state, a policymaker dashboard, any language beyond Spanish and English.
