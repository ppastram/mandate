// Builds runtime data from the authored source in data/map_data.json:
//   public/data/countries.min.json          -> slim index for the picker + map tint
//   public/data/country/<ISO3>.json         -> per-country detail, loaded on demand
//
// Run with:  npm run build:data
import fs from 'node:fs/promises'
import path from 'node:path'

const SRC         = 'data/map_data.json'
const SRC_TOPO    = 'data/countries-110m.json'
const OUT_INDEX   = 'public/data/countries.min.json'
const OUT_TOPO    = 'public/data/countries-110m.json'
const OUT_DIR     = 'public/data/country'

/**
 * Split key_laws ONLY where a closing paren is followed by a comma.
 * Any other comma inside a law title (dates, clauses) is preserved.
 * The ")" that was consumed by the split is re-appended to each item
 * except the last one in the sequence.
 */
function splitKeyLaws(raw) {
  if (typeof raw !== 'string') return []
  const s = raw.trim()
  if (!s) return []
  const parts = s.split(/\),\s*/)
  return parts
    .map((part, i) => {
      const trimmed = part.trim()
      return i < parts.length - 1 ? trimmed + ')' : trimmed
    })
    .filter(Boolean)
}

async function main() {
  const raw = JSON.parse(await fs.readFile(SRC, 'utf8'))
  const countries = raw.countries || {}

  await fs.mkdir(OUT_DIR, { recursive: true })

  // Wipe stale per-country files to avoid orphans when a code disappears
  for (const f of await fs.readdir(OUT_DIR)) {
    if (f.endsWith('.json')) await fs.unlink(path.join(OUT_DIR, f))
  }

  const index = []
  let detailBytes = 0

  for (const [iso3, c] of Object.entries(countries)) {
    index.push({
      iso3,
      iso2:        c.iso2,
      numeric:     c.numeric,
      name:        c.name,
      gov_profile: c.gov_profile,
      confidence:  c.confidence,
    })

    const detail = {
      iso3,
      key_laws: splitKeyLaws(c.key_laws),
      sources:  Array.isArray(c.sources) ? c.sources : [],
      notes: {
        regulation_summary: c.regulation?.summary      ?? null,
        binding_note:       c.regulation?.binding_note ?? null,
        promotion_note:     c.promotion?.note          ?? null,
      },
    }

    const detailStr = JSON.stringify(detail)
    await fs.writeFile(path.join(OUT_DIR, `${iso3}.json`), detailStr)
    detailBytes += detailStr.length
  }

  // Alphabetical by name for picker UX
  index.sort((a, b) => a.name.localeCompare(b.name))

  const indexStr = JSON.stringify(index)
  await fs.writeFile(OUT_INDEX, indexStr)

  // Copy the topojson geometry so Vite serves it as a static asset.
  await fs.copyFile(SRC_TOPO, OUT_TOPO)

  const srcKB   = ((await fs.stat(SRC)).size / 1024).toFixed(1)
  const idxKB   = (indexStr.length / 1024).toFixed(1)
  const detKB   = (detailBytes / 1024).toFixed(1)
  const topoKB  = ((await fs.stat(OUT_TOPO)).size / 1024).toFixed(1)
  console.log(`✓ ${index.length} countries`)
  console.log(`  source:                 ${srcKB} KB  (${SRC})`)
  console.log(`  countries.min.json:     ${idxKB} KB  (served at /data/countries.min.json)`)
  console.log(`  country/<ISO3>.json:    ${detKB} KB total  (lazy)`)
  console.log(`  countries-110m.json:    ${topoKB} KB  (lazy, map screen only)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
