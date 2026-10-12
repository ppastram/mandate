import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../i18n/LangProvider.jsx'
import { useCountries } from '../hooks/useCountries.js'
import { submitContact, isSupabaseConfigured } from '../lib/supabase.js'
import Button from './Button.jsx'
import './ContactModal.css'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function ContactModal({ open, onClose, defaultCountryIso3 }) {
  const { t, lang, displayCountry } = useLang()
  const countries = useCountries()
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [email, setEmail] = useState('')
  const [countryIso3, setCountryIso3] = useState(defaultCountryIso3 ?? '')
  const [status, setStatus] = useState('idle')  // idle | sending | success | error
  const [error, setError] = useState(null)

  // Sync default country when it changes externally
  useEffect(() => {
    if (defaultCountryIso3 && !countryIso3) setCountryIso3(defaultCountryIso3)
  }, [defaultCountryIso3, countryIso3])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Reset when the modal closes
  useEffect(() => {
    if (!open) {
      setStatus('idle')
      setError(null)
    }
  }, [open])

  const sortedCountries = useMemo(() => {
    if (!Array.isArray(countries)) return []
    const collator = new Intl.Collator(lang, { sensitivity: 'base' })
    return countries
      .map((c) => ({ ...c, display: displayCountry(c.iso2, c.name) }))
      .sort((a, b) => collator.compare(a.display, b.display))
  }, [countries, lang, displayCountry])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !institution.trim() || !email.trim()) {
      setError(t('contact.err_required'))
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('contact.err_email'))
      return
    }
    if (!isSupabaseConfigured()) {
      setError(t('contact.disabled'))
      return
    }

    setStatus('sending')
    try {
      await submitContact({
        name: name.trim(),
        institution: institution.trim(),
        email: email.trim(),
        countryIso3: countryIso3 || null,
      })
      setStatus('success')
    } catch (err) {
      console.error('[submit_contact]', err)
      setStatus('error')
      setError(t('contact.err_server'))
    }
  }

  return (
    <div className="cm__backdrop" onClick={onClose} role="presentation">
      <div
        className="cm__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cm__close" onClick={onClose} aria-label="Close">×</button>

        {status === 'success' ? (
          <div className="cm__success">
            <h2 id="cm-title" className="cm__title">{t('contact.success_title')}</h2>
            <p className="cm__subtitle">{t('contact.success_body', { email })}</p>
            <div className="cm__actions">
              <Button variant="primary" onClick={onClose}>{t('contact.close')}</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 id="cm-title" className="cm__title">{t('contact.title')}</h2>
            <p className="cm__subtitle">{t('contact.subtitle')}</p>

            <label className="cm__field">
              <span className="cm__label">{t('contact.name')}</span>
              <input className="cm__input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </label>
            <label className="cm__field">
              <span className="cm__label">{t('contact.institution')}</span>
              <input className="cm__input" value={institution} onChange={(e) => setInstitution(e.target.value)} required />
            </label>
            <label className="cm__field">
              <span className="cm__label">{t('contact.email')}</span>
              <input className="cm__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="cm__field">
              <span className="cm__label">{t('contact.country')}</span>
              <select
                className="cm__input"
                value={countryIso3}
                onChange={(e) => setCountryIso3(e.target.value)}
              >
                <option value=""></option>
                {sortedCountries.map((c) => (
                  <option key={c.iso3} value={c.iso3}>{c.display}</option>
                ))}
              </select>
            </label>

            {error && <p className="cm__error" role="alert">{error}</p>}

            <div className="cm__actions">
              <Button variant="ghost" type="button" onClick={onClose}>{t('contact.cancel')}</Button>
              <Button variant="primary" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? t('contact.sending') : t('contact.submit')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
