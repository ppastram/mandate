import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Null when env vars are missing — the app still works offline. */
export const supabase = (URL && KEY)
  ? createClient(URL, KEY, { auth: { persistSession: false } })
  : null

export const isSupabaseConfigured = () => !!supabase

/**
 * Upsert the user's response by device_id.
 * Resolves to the stored row, or { skipped: true } when Supabase is not configured.
 */
export async function submitResponse({ deviceId, countryIso3, region, answers, lang }) {
  if (!supabase) {
    console.warn('[supabase] not configured; skipping submission')
    return { skipped: true }
  }
  const { data, error } = await supabase.rpc('submit_response', {
    p_device_id:    deviceId,
    p_country_iso3: countryIso3,
    p_region:       region ?? null,
    p_a1: answers[0], p_a2: answers[1], p_a3: answers[2],
    p_a4: answers[3], p_a5: answers[4], p_a6: answers[5],
    p_lang:         lang,
  })
  if (error) throw error
  return { data }
}

/** Returns aggregates per country (averages gated at n ≥ 30 server-side). */
export async function fetchCountryResults() {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('country_results')
  if (error) throw error
  return data ?? []
}

/** Policymaker contact form. Resolves to the new row id. */
export async function submitContact({ name, institution, email, countryIso3 }) {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }
  const { data, error } = await supabase.rpc('submit_contact', {
    p_name:         name,
    p_institution:  institution,
    p_email:        email,
    p_country_iso3: countryIso3 ?? null,
  })
  if (error) throw error
  return { id: data }
}
