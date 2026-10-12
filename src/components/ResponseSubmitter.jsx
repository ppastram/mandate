import { useEffect, useRef } from 'react'
import { useQuiz } from '../state/QuizProvider.jsx'
import { useLang } from '../i18n/LangProvider.jsx'
import { submitResponse, isSupabaseConfigured } from '../lib/supabase.js'
import { invalidateCountryResults, loadCountryResults } from '../hooks/useCountryResults.js'

const LS_LAST = 'mandate.submitted'

/**
 * Fires submit_response() when the quiz completes (first time and
 * every time the user re-completes after changing answers), using
 * a hash of the payload stored in localStorage to prevent duplicate
 * submits on refresh / re-render.
 */
export default function ResponseSubmitter() {
  const { state, deviceId } = useQuiz()
  const { lang } = useLang()
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    if (!state.completed) return
    if (!state.countryIso3) return
    if (!deviceId) return
    if (state.answers.some((a) => a === null || a === undefined)) return
    if (inFlightRef.current) return

    const payload = {
      deviceId,
      countryIso3: state.countryIso3,
      region:      state.region,
      answers:     state.answers,
      lang,
    }
    const key = JSON.stringify(payload)
    let last = null
    try { last = localStorage.getItem(LS_LAST) } catch {}
    if (last === key) return

    inFlightRef.current = true
    submitResponse(payload)
      .then(() => {
        try { localStorage.setItem(LS_LAST, key) } catch {}
        // Refresh aggregate counts so result/map pick up the new vote.
        invalidateCountryResults()
        loadCountryResults(true).catch(() => { /* non-fatal */ })
      })
      .catch((err) => {
        console.error('[submit_response] failed:', err?.message ?? err)
      })
      .finally(() => { inFlightRef.current = false })
  }, [
    state.completed,
    state.countryIso3,
    state.region,
    state.answers,
    deviceId,
    lang,
  ])

  return null
}
