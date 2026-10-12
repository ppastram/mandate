import { useLang } from '../i18n/LangProvider.jsx'
import './CountryPanel.css'

/**
 * tone: 'regulation' (blue) | 'promotion' (orange)
 * score: 0-100 or null
 */
export default function CountryPanel({ country, tone = 'regulation' }) {
  const { t, displayCountry } = useLang()

  const name  = country ? displayCountry(country.iso2, country.name) : ''
  const score = tone === 'regulation'
    ? country?.gov_profile?.regulation
    : country?.gov_profile?.promotion
  const scoreStr = Number.isFinite(score) ? String(score) : ''
  const conf = country?.confidence

  return (
    <aside className={`country-panel country-panel--${tone}`}>
      <div className="country-panel__card">

        <div className="country-panel__head">
          <span className="country-panel__title">{t('panel.today', { country: name })}</span>
          <span className="country-panel__subtitle">{t(`panel.axis.${tone}`)}</span>
        </div>

        <div className="country-panel__body">
          <div className="country-panel__score-col">
            <span className="country-panel__number">{scoreStr}</span>
            <p className="country-panel__score-desc">{t(`panel.of_100.${tone}`)}</p>
          </div>
          <div className="country-panel__map-col">
            <MapPlaceholder tone={tone} iso2={country?.iso2 ?? null} />
          </div>
        </div>

        <p className="country-panel__note">
          {t('panel.score_note')}
          {conf && (
            <span className="country-panel__confidence"> · {t(`confidence.${conf}`)}</span>
          )}
        </p>
      </div>
    </aside>
  )
}

/**
 * TODO: replace with the real d3-geo + topojson map once wired up.
 * For now, a stylized placeholder that respects the tone (blue/orange)
 * and highlights the selected country in yellow.
 */
function MapPlaceholder({ tone, iso2 }) {
  const land = '#D9D9D4'
  const tint = tone === 'regulation' ? '#1D3FD1' : '#C4420A'
  return (
    <div className="country-panel__map-ph">
      <svg viewBox="0 0 120 75" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="120" height="75" fill="#FFFFFF"/>
        <path d="M10 12 Q18 8 24 14 Q28 22 22 28 Q14 30 10 24 Z" fill={land}/>
        <path d="M20 34 Q26 30 32 34 Q36 42 32 52 Q24 56 18 50 Q14 42 20 34 Z" fill={tint} opacity="0.5"/>
        <path d="M52 10 Q62 8 66 14 Q68 20 62 22 Q54 22 52 16 Z" fill={land}/>
        <path d="M54 28 Q62 24 68 30 Q72 42 66 52 Q58 56 52 50 Q48 40 54 28 Z" fill={land}/>
        <path d="M70 8 Q92 6 102 14 Q108 24 100 30 Q88 32 74 28 Q66 20 70 8 Z" fill={land}/>
        <path d="M88 46 Q96 42 102 48 Q106 56 100 60 Q92 62 86 58 Q82 52 88 46 Z" fill={land}/>
        {iso2 && (
          <circle cx="26" cy="40" r="3.5" fill="#FFC800" stroke="#0E0E0E" strokeWidth="1"/>
        )}
      </svg>
    </div>
  )
}
