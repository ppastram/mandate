// Serves /r?c=…&reg=…&pro=…&l=… as the SPA shell with per-result
// OG/Twitter meta tags injected. Scrapers see the tags; humans get
// the SPA which boots and renders SharedResultScreen client-side.
import { HTML_TEMPLATE } from './_template.js'

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function clamp(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}

export default function handler(req, res) {
  const { c = 'COL', reg = '0', pro = '0', l = 'es' } = req.query ?? {}
  const iso3 = String(c).toUpperCase().slice(0, 3)
  const r    = clamp(reg)
  const p    = clamp(pro)
  const lang = l === 'en' ? 'en' : 'es'

  const proto   = req.headers['x-forwarded-proto'] || 'https'
  const host    = req.headers['x-forwarded-host'] || req.headers.host
  const origin  = `${proto}://${host}`
  const canonical = `${origin}/r?c=${iso3}&reg=${r}&pro=${p}&l=${lang}`
  const ogImage   = `${origin}/api/og?c=${iso3}&reg=${r}&pro=${p}&l=${lang}`

  const title = `Mandate: ${iso3} ${r}/${p}`
  const description = lang === 'es'
    ? `Mi postura sobre IA en ${iso3}: Regulación ${r}, Fomento ${p}.`
    : `My stance on AI in ${iso3}: Regulation ${r}, Promotion ${p}.`

  const injected = `
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${esc(ogImage)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${esc(canonical)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(ogImage)}">
    <link rel="canonical" href="${esc(canonical)}">
    <title>${esc(title)}</title>
  `

  const html = HTML_TEMPLATE
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace('</head>', `${injected}</head>`)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=86400')
  res.end(html)
}
