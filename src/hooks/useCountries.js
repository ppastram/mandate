import { useEffect, useState } from 'react'

/**
 * Loads the slim country index once at app start.
 * Returns null while loading, [] on failure, or the sorted array.
 */
export function useCountries() {
  const [countries, setCountries] = useState(null)

  useEffect(() => {
    let alive = true
    fetch('/data/countries.min.json')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then((data) => { if (alive) setCountries(data) })
      .catch((err) => {
        console.error('[useCountries] failed to load index:', err)
        if (alive) setCountries([])
      })
    return () => { alive = false }
  }, [])

  return countries
}
