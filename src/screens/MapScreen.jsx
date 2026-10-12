import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider.jsx'
import { useCountries } from '../hooks/useCountries.js'
import { useTopology } from '../hooks/useTopology.js'
import { useCountryResults } from '../hooks/useCountryResults.js'
import { useQuiz } from '../state/QuizProvider.jsx'
import WorldMap, { LAYER_SWATCHES, NO_DATA_COLOR } from '../components/WorldMap.jsx'
import Button from '../components/Button.jsx'
import './MapScreen.css'

const LAYERS = ['regulation', 'promotion', 'difference', 'votes']

export default function MapScreen() {
  const { t, displayCountry } = useLang()
  const navigate = useNavigate()
  const countries = useCountries()
  const topology  = useTopology()
  const { byIso3: resultsByIso3, status: resultsStatus } = useCountryResults()
  const { state, setCountry } = useQuiz()

  const [layer, setLayer] = useState('regulation')

  const selected = countries?.find((c) => c.iso3 === state.countryIso3) ?? null

  const vote = () => {
    if (!selected) return
    navigate('/')
  }

  const pickOnMap = (iso3) => {
    setCountry(iso3)
  }

  return (
    <section className="map-screen">
      <div className="map-screen__container">

        <header className="map-screen__head">
          <h1 className="map-screen__title">{t('map.title')}</h1>
          <nav className="map-screen__tabs" role="tablist" aria-label={t('map.title')}>
            {LAYERS.map((L) => {
              const disabled = L === 'votes' && resultsStatus === 'disabled'
              return (
                <button
                  key={L}
                  type="button"
                  role="tab"
                  aria-selected={layer === L}
                  disabled={disabled}
                  className={`map-screen__tab${layer === L ? ' is-active' : ''}`}
                  onClick={() => setLayer(L)}
                  title={disabled
                    ? `${t(`map.layer.tooltip.${L}`)} (Supabase)`
                    : t(`map.layer.tooltip.${L}`)}
                >
                  {t(`map.layer.${L}`)}
                </button>
              )
            })}
          </nav>
        </header>

        <WorldMap
          topology={topology}
          countries={countries}
          layer={layer}
          selectedIso3={state.countryIso3}
          onSelect={pickOnMap}
          resultsByIso3={resultsByIso3}
        />

        <Legend layer={layer} />

        <SelectedCard
          country={selected}
          layer={layer}
          voteN={selected ? resultsByIso3.get(selected.iso3)?.n : null}
          onVote={vote}
          displayCountry={displayCountry}
          t={t}
        />
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────── */

function Legend({ layer }) {
  const { t } = useLang()
  const swatches = LAYER_SWATCHES[layer]

  let leftLabel, rightLabel, nodataLabel
  if (layer === 'difference') {
    leftLabel   = t('map.legend.diff.low')
    rightLabel  = t('map.legend.diff.high')
    nodataLabel = t('map.legend.nodata')
  } else if (layer === 'votes') {
    leftLabel   = t('map.legend.votes.low')
    rightLabel  = t('map.legend.votes.high')
    nodataLabel = t('map.legend.votes.nodata')
  } else {
    leftLabel   = t('map.legend.low')
    rightLabel  = t('map.legend.high')
    nodataLabel = t('map.legend.nodata')
  }

  return (
    <div className="legend">
      <span className="legend__end legend__end--left">{leftLabel}</span>
      <div className="legend__swatches" aria-hidden="true">
        {swatches.map((c, i) => (
          <span key={i} className="legend__sw" style={{ background: c }} />
        ))}
      </div>
      <span className="legend__end legend__end--right">{rightLabel}</span>
      <span className="legend__nodata">
        <span className="legend__sw" style={{ background: NO_DATA_COLOR }} />
        {nodataLabel}
      </span>
    </div>
  )
}

function SelectedCard({ country, layer, voteN, onVote, displayCountry, t }) {
  if (!country) {
    return (
      <div className="sel-card sel-card--empty">
        <p className="sel-card__hint">{t('map.hint')}</p>
      </div>
    )
  }
  const name = displayCountry(country.iso2, country.name)
  const reg  = country.gov_profile?.regulation
  const pro  = country.gov_profile?.promotion
  const diff = Number.isFinite(reg) && Number.isFinite(pro) ? (pro - reg) : null

  return (
    <div className="sel-card">
      <div className="sel-card__head">
        <span className="sel-card__code" aria-hidden="true">{country.iso3}</span>
        <h2 className="sel-card__name">{name}</h2>
      </div>
      <dl className="sel-card__scores">
        <ScoreRow label={t('map.score.regulation')} value={reg} active={layer === 'regulation'} />
        <ScoreRow label={t('map.score.promotion')}  value={pro} active={layer === 'promotion'} />
        <ScoreRow
          label={t('map.score.difference')}
          value={diff}
          formatter={(v) => (v > 0 ? `+${v}` : String(v))}
          active={layer === 'difference'}
        />
        {Number.isFinite(voteN) && (
          <ScoreRow label={t('map.score.votes')} value={voteN} active={layer === 'votes'} />
        )}
      </dl>
      <Button variant="primary" onClick={onVote}>
        {t('map.selected.vote', { country: name })}
      </Button>
    </div>
  )
}

function ScoreRow({ label, value, active, formatter }) {
  const shown = (typeof value === 'number' && Number.isFinite(value))
    ? (formatter ? formatter(value) : String(value))
    : ''
  return (
    <div className={`sel-card__row${active ? ' is-active' : ''}`}>
      <dt className="sel-card__label">{label}</dt>
      <dd className="sel-card__value">{shown}</dd>
    </div>
  )
}
