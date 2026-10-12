import { useLang } from '../i18n/LangProvider.jsx'
import CountryPicker from './CountryPicker.jsx'
import './Header.css'

export default function Header({ countries, selectedIso3, onPickCountry, showPicker = true }) {
  const { lang, setLang, t } = useLang()
  const count = Array.isArray(countries) ? countries.length : 195

  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <span className="header__logo-mark">M</span>
          <span className="header__wordmark">Mandate</span>
        </div>

        <p className="header__tagline">{t('brand.tagline', { n: count })}</p>

        <div className="header__controls">
          {showPicker && (
            <CountryPicker
              countries={countries}
              value={selectedIso3}
              onChange={onPickCountry}
              variant="header"
            />
          )}
          <div className="header__lang" role="group" aria-label="Language">
            <button
              type="button"
              className={`header__lang-btn${lang === 'es' ? ' is-active' : ''}`}
              onClick={() => setLang('es')}
            >ES</button>
            <span className="header__lang-sep">/</span>
            <button
              type="button"
              className={`header__lang-btn${lang === 'en' ? ' is-active' : ''}`}
              onClick={() => setLang('en')}
            >EN</button>
          </div>
        </div>
      </div>
    </header>
  )
}
