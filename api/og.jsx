import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

// ─── Shared quadrant logic (mirrors ResultScreen) ────────────────────
const QUADRANTS = {
  es: { hh: 'Acelerar con reglas', lh: 'Acelerar sin trabas',
        hl: 'Frenar',              ll: 'No intervenir',
        none: 'Sin postura definida' },
  en: { hh: 'Build with rules',    lh: 'Build freely',
        hl: 'Slow down',           ll: 'Hands off',
        none: 'No clear position' },
}
const AXIS_LABELS = {
  es: { reg: 'Regulación', pro: 'Fomento' },
  en: { reg: 'Regulation', pro: 'Promotion' },
}
function quadrantKey(reg, pro) {
  if (reg === 50 && pro === 50) return 'none'
  return (reg >= 50 ? 'h' : 'l') + (pro >= 50 ? 'h' : 'l')
}
function clamp(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

// ─── Country name lookup (cached per cold start) ─────────────────────
let COUNTRIES = null
async function getCountries(origin) {
  if (COUNTRIES) return COUNTRIES
  try {
    COUNTRIES = await fetch(`${origin}/data/countries.min.json`).then((r) => r.json())
  } catch { COUNTRIES = [] }
  return COUNTRIES
}

// Libre Franklin + IBM Plex Mono, cached across invocations
let FONT_BOLD = null
let FONT_REG  = null
let FONT_MONO = null
async function getFonts() {
  if (!FONT_BOLD) {
    FONT_BOLD = fetch('https://cdn.jsdelivr.net/fontsource/fonts/libre-franklin@latest/latin-800-normal.ttf').then((r) => r.arrayBuffer())
  }
  if (!FONT_REG) {
    FONT_REG = fetch('https://cdn.jsdelivr.net/fontsource/fonts/libre-franklin@latest/latin-400-normal.ttf').then((r) => r.arrayBuffer())
  }
  if (!FONT_MONO) {
    FONT_MONO = fetch('https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-500-normal.ttf').then((r) => r.arrayBuffer())
  }
  return Promise.all([FONT_REG, FONT_BOLD, FONT_MONO])
}

// ─── Handler ─────────────────────────────────────────────────────────
export default async function handler(req) {
  const url = new URL(req.url)
  const iso3 = (url.searchParams.get('c') || 'COL').toUpperCase()
  const reg  = clamp(url.searchParams.get('reg'))
  const pro  = clamp(url.searchParams.get('pro'))
  const lang = url.searchParams.get('l') === 'en' ? 'en' : 'es'

  const [regFont, boldFont, monoFont] = await getFonts()
  const countries = await getCountries(url.origin)
  const country   = countries.find((c) => c.iso3 === iso3)
  let countryName = iso3
  if (country?.iso2) {
    try {
      countryName = new Intl.DisplayNames([lang], { type: 'region' }).of(country.iso2) || country.name || iso3
    } catch { countryName = country.name || iso3 }
  }

  const qKey = quadrantKey(reg, pro)
  const quadrant = QUADRANTS[lang][qKey]
  const axis = AXIS_LABELS[lang]

  // Dot position inside the chart card
  const CHART = 320
  const toX = (v) => (v / 100) * CHART
  const toY = (v) => ((100 - v) / 100) * CHART

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex',
        background: '#FFFFFF',
        color: '#0E0E0E',
        fontFamily: 'Libre Franklin',
        padding: 56,
        borderTop: '8px solid #0E0E0E',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0E0E0E', color: '#FFFFFF',
              fontSize: 24, fontWeight: 800,
            }}>M</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Mandate</div>
          </div>

          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 16, color: '#555555', marginBottom: 10, letterSpacing: 0 }}>
            {lang === 'es' ? 'Mi postura sobre IA en' : 'My stance on AI in'}
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 28 }}>
            {countryName}
          </div>
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            padding: '10px 18px',
            background: '#FFC800', color: '#0E0E0E',
            border: '1.5px solid #0E0E0E',
            fontSize: 24, fontWeight: 800,
            marginBottom: 40,
          }}>{quadrant}</div>

          <div style={{ display: 'flex', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: '#555555', marginBottom: 6 }}>{axis.reg}</div>
              <div style={{ fontSize: 72, fontWeight: 800, color: '#1D3FD1', letterSpacing: '-0.03em', lineHeight: 1 }}>{reg}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, color: '#555555', marginBottom: 6 }}>{axis.pro}</div>
              <div style={{ fontSize: 72, fontWeight: 800, color: '#C4420A', letterSpacing: '-0.03em', lineHeight: 1 }}>{pro}</div>
            </div>
          </div>
        </div>

        <div style={{
          position: 'relative',
          width: CHART, height: CHART,
          background: '#FFFFFF',
          border: '1px solid #0E0E0E',
          display: 'flex',
          alignSelf: 'center',
        }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: CHART/2, width: 1, background: '#D9D9D4' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: CHART/2, height: 1, background: '#D9D9D4' }} />
          <div style={{
            position: 'absolute',
            left: toX(reg) - 14, top: toY(pro) - 14,
            width: 28, height: 28,
            background: '#FFC800',
            border: '3px solid #0E0E0E',
            borderRadius: '50%',
            display: 'flex',
          }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Libre Franklin', data: regFont,  weight: 400, style: 'normal' },
        { name: 'Libre Franklin', data: boldFont, weight: 800, style: 'normal' },
        { name: 'IBM Plex Mono',  data: monoFont, weight: 500, style: 'normal' },
      ],
      headers: {
        'cache-control': 'public, max-age=60, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}
