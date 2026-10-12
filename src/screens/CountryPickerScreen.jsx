import { useMemo } from 'react'
import { useLang } from '../i18n/LangProvider.jsx'
import CountryPicker from '../components/CountryPicker.jsx'
import Button from '../components/Button.jsx'
import './CountryPickerScreen.css'

export default function CountryPickerScreen({ countries, selectedIso3, onPick, onStart }) {
  const { t, lang } = useLang()

  // Suggest from browser locale region (never asks for geolocation permission)
  const suggestedIso3 = useMemo(() => {
    if (!Array.isArray(countries) || countries.length === 0) return null
    try {
      const region = new Intl.Locale(navigator.language).maximize().region
      if (!region) return null
      const match = countries.find((c) => c.iso2 === region)
      return match?.iso3 ?? null
    } catch { return null }
  }, [countries, lang])

  return (
    <section className="pick-screen">
      <div className="pick-screen__container">
        <div className="pick-screen__inner">
          <h1 className="pick-screen__title">{t('pick.title')}</h1>
          <p className="pick-screen__subtitle">{t('pick.subtitle')}</p>

          <CountryPicker
            countries={countries}
            value={selectedIso3}
            onChange={onPick}
            variant="inline"
            suggestedIso3={suggestedIso3}
            autoFocus
          />

          <div className="pick-screen__actions">
            <Button
              variant="primary"
              onClick={onStart}
              disabled={!selectedIso3}
            >
              {t('pick.start')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
