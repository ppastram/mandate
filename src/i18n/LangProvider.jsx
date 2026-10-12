import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { dictionary } from './dictionary.js'

const LS_KEY = 'mandate.lang'
const LangContext = createContext(null)

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch {}
  const browser = (navigator.language || 'es').toLowerCase().split('-')[0]
  return browser === 'en' ? 'en' : 'es'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang)

  const setLang = useCallback((next) => {
    try { localStorage.setItem(LS_KEY, next) } catch {}
    setLangState(next)
  }, [])

  const t = useCallback((key, vars) => {
    const str = dictionary[lang]?.[key] ?? dictionary.es[key] ?? key
    if (!vars) return str
    return Object.keys(vars).reduce(
      (s, k) => s.replaceAll(`{${k}}`, String(vars[k])),
      str,
    )
  }, [lang])

  const displayCountry = useCallback((iso2, fallback) => {
    try {
      const dn = new Intl.DisplayNames([lang], { type: 'region' })
      return dn.of(iso2) || fallback || iso2
    } catch {
      return fallback || iso2
    }
  }, [lang])

  const value = useMemo(
    () => ({ lang, setLang, t, displayCountry }),
    [lang, setLang, t, displayCountry],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>')
  return ctx
}
