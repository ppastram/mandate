import { useEffect, useMemo, useState } from 'react'
import { fetchCountryResults, isSupabaseConfigured } from '../lib/supabase.js'

/**
 * Shared cache for public.country_results(). Resolves per-country
 * { n, a1_avg..a6_avg, reg_avg, pro_avg } — averages are null below 30.
 *
 * Subscribers are notified when a fresh fetch lands; ResponseSubmitter
 * invalidates and refetches after a successful submit so the UI picks
 * up the just-cast vote without a reload.
 */

const TTL_MS = 60_000

let cache = null
let cachedAt = 0
let inFlight = null
const subscribers = new Set()

function notify() { for (const fn of subscribers) fn(cache) }

export async function loadCountryResults(force = false) {
  if (!isSupabaseConfigured()) {
    cache = cache ?? []
    cachedAt = Date.now()
    return cache
  }
  const fresh = cache && !force && (Date.now() - cachedAt) < TTL_MS
  if (fresh) return cache
  if (inFlight) return inFlight
  inFlight = fetchCountryResults()
    .then((d) => {
      cache = d ?? []
      cachedAt = Date.now()
      inFlight = null
      notify()
      return cache
    })
    .catch((err) => { inFlight = null; throw err })
  return inFlight
}

export function invalidateCountryResults() {
  cachedAt = 0
}

export function useCountryResults() {
  const [data, setData] = useState(cache)
  const [status, setStatus] = useState(() => {
    if (!isSupabaseConfigured()) return 'disabled'
    return cache ? 'ready' : 'loading'
  })

  useEffect(() => {
    if (!isSupabaseConfigured()) { setStatus('disabled'); return }
    const sub = (d) => { setData(d); setStatus('ready') }
    subscribers.add(sub)
    if (!cache) setStatus('loading')
    loadCountryResults()
      .then((d) => { setData(d); setStatus('ready') })
      .catch((err) => { console.error('[useCountryResults]', err); setStatus('error') })
    return () => { subscribers.delete(sub) }
  }, [])

  const byIso3 = useMemo(() => {
    const m = new Map()
    for (const r of data ?? []) m.set(r.country_iso3, r)
    return m
  }, [data])

  return { results: data, byIso3, status }
}
