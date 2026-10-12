import { useEffect, useState } from 'react'

const cache = new Map()
const inFlight = new Map()

/**
 * Lazily loads the per-country detail file.
 * key_laws (array), sources (array of urls), notes { regulation_summary, binding_note, promotion_note }.
 */
export function useCountryDetail(iso3) {
  const [detail, setDetail] = useState(() => (iso3 ? cache.get(iso3) ?? null : null))

  useEffect(() => {
    if (!iso3) { setDetail(null); return }
    const cached = cache.get(iso3)
    if (cached) { setDetail(cached); return }

    let alive = true
    const existing = inFlight.get(iso3)
    const p = existing ?? fetch(`/data/country/${iso3}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((d) => { cache.set(iso3, d); inFlight.delete(iso3); return d })
      .catch((err) => { inFlight.delete(iso3); throw err })
    if (!existing) inFlight.set(iso3, p)

    p.then((d) => { if (alive) setDetail(d) })
     .catch((err) => { console.error('[useCountryDetail]', iso3, err); if (alive) setDetail(null) })

    return () => { alive = false }
  }, [iso3])

  return detail
}
