# Mandate

Civic poll: people vote on six AI policy statements and compare their view with their government's position. Read docs/SPEC.md and docs/SOURCES.md before building.

## Stack
Vite + React + TypeScript. Supabase for votes. d3-geo + topojson-client for maps. Deployed on Vercel. No UI library.

## Design system (match docs/design/quiz.png)
- Colors: ink #0E0E0E, paper #FFFFFF, regulation blue #1D3FD1, promotion orange #C4420A, user yellow #FFC800, blue tint #EEF1FD, grey text #555555, rule #D9D9D4.
- Blue always means regulation, orange always means promotion, yellow always means the user or the selected country.
- Type: Libre Franklin (800 for statements and headings, 400 to 600 for body), IBM Plex Mono 500 for small data labels only.
- Square corners everywhere. Thin rules instead of cards. No shadows, gradients, emoji or icon libraries.
- Left-aligned layouts. One dominant element per screen.
- Touch targets at least 44px. Real buttons and links. Visible focus outline.
- Keep colors, type and spacing as CSS variables in src/styles/tokens.css.

## Data rules
- Never invent numbers, laws or vote counts. Everything shown comes from data/ or from Supabase.
- gov_profile scores are percentiles among countries. Never subtract them from user scores or show a match percentage.
- Every screen that shows data carries the source credits from docs/SOURCES.md.
- All UI text lives in src/i18n (Spanish default, English).

## Writing style for UI text
Plain and short. No em dashes.# mandate
