import { useEffect, useState } from 'react'

let cache = null
let inFlight = null

/**
 * Fetches the Natural Earth 110m topojson once and caches it in memory.
 * Returns null while loading, the raw Topology object once ready.
 */
export function useTopology() {
  const [topo, setTopo] = useState(cache)

  useEffect(() => {
    if (cache) { setTopo(cache); return }
    let alive = true
    const p = inFlight ?? fetch('/data/countries-110m.json')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((d) => { cache = d; inFlight = null; return d })
      .catch((err) => { inFlight = null; throw err })
    if (!inFlight) inFlight = p

    p.then((d) => { if (alive) setTopo(d) })
     .catch((err) => { console.error('[useTopology]', err); if (alive) setTopo(null) })

    return () => { alive = false }
  }, [])

  return topo
}
