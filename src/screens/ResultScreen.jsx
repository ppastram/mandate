import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider.jsx'
import { useCountryResults } from '../hooks/useCountryResults.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { useOgTags } from '../hooks/useOgTags.js'
import QuadrantChart from '../components/QuadrantChart.jsx'
import Button from '../components/Button.jsx'
import ContactModal from '../components/ContactModal.jsx'
import './ResultScreen.css'

/** 50 or more counts as high. Special: both exactly 50 → no clear position. */
export function quadrantKey(reg, pro) {
  if (reg === 50 && pro === 50) return 'none'
  const r = reg >= 50 ? 'h' : 'l'
  const p = pro >= 50 ? 'h' : 'l'
  return r + p
}

export function averageWhole(values) {
  const nums = values.filter((v) => typeof v === 'number')
  if (nums.length === 0) return 0
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length
  return Math.round(avg)
}

export default function ResultScreen({
  country,
  totalCountries,
  userReg,
  userPro,
  onChangeAnswers,
  readOnly = false,
}) {
  const { t, lang, displayCountry } = useLang()
  const navigate = useNavigate()
  const { byIso3, status: resultsStatus } = useCountryResults()
  const [contactOpen, setContactOpen] = useState(false)

  const countryName = country ? displayCountry(country.iso2, country.name) : ''
  const countryReg  = country?.gov_profile?.regulation ?? 0
  const countryPro  = country?.gov_profile?.promotion  ?? 0

  // Aggregated voter data for this country (null when Supabase disabled / loading / <30)
  const agg = country ? byIso3.get(country.iso3) : null
  const voterCount = agg?.n ?? 0
  const voters = (agg && voterCount >= 30
      && Number.isFinite(Number(agg.reg_avg))
      && Number.isFinite(Number(agg.pro_avg)))
    ? { reg: Number(agg.reg_avg), pro: Number(agg.pro_avg) }
    : null
  const showVoterBlock = resultsStatus === 'ready' || resultsStatus === 'loading'

  const userQ    = quadrantKey(userReg, userPro)
  const countryQ = quadrantKey(countryReg, countryPro)
  const same     = userQ === countryQ && userQ !== 'none'

  const youLabel  = t(`quadrant.${userQ}`)
  const themLabel = t(`quadrant.${countryQ}`)

  const headline = t('result.headline', {
    you: youLabel,
    country: countryName,
    them: themLabel,
  })

  // Live-update OG tags for in-app shares (bots get them from api/share.js in prod)
  const shareUrl = country ? buildShareUrl(country.iso3, userReg, userPro, lang) : null
  useOgTags({
    title: country ? t('result.share_title', { country: countryName }) : 'Mandate',
    description: country ? t('result.share_text', {
      userReg, userPro, country: countryName, countryReg, countryPro,
    }) : null,
    image: country
      ? `${window.location.origin}/api/og?c=${country.iso3}&reg=${userReg}&pro=${userPro}&l=${lang}`
      : null,
    url: shareUrl,
  })

  const share = async () => {
    const url = buildShareUrl(country?.iso3, userReg, userPro, lang)
    const text = t('result.share_text', {
      userReg, userPro,
      country: countryName,
      countryReg, countryPro,
    })
    const title = t('result.share_title', { country: countryName })
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`)
      }
    } catch (err) {
      // User cancelled or permission denied — don't log noise
      if (err?.name !== 'AbortError') console.error('[share]', err)
    }
  }

  return (
    <section className="result">
      <div className="result__container">
        <h1 className="result__title">{t('result.title')}</h1>

        <div className="result__card">
          <QuadrantChart
            userReg={userReg}
            userPro={userPro}
            countryReg={countryReg}
            countryPro={countryPro}
            countryName={countryName}
            voters={voters}
          />

          <p className="result__headline">{headline}</p>
          <p className="result__same">
            {same ? t('result.same_quadrant') : t('result.different_quadrant')}
          </p>

          {showVoterBlock && voters && (
            <p className="result__voters-note">
              {t('result.voters_note', { n: voterCount, country: countryName })}
            </p>
          )}
          {showVoterBlock && !voters && !readOnly && (
            <p className="result__unlock">
              {t('result.unlock', { n: Math.max(voterCount, 1), country: countryName })}
            </p>
          )}
        </div>

        <div className="result__axes">
          <p className="result__axis-row">
            {t('result.axis.regulation', { you: userReg, country: countryName, them: countryReg, n: totalCountries })}
          </p>
          <p className="result__axis-row">
            {t('result.axis.promotion',  { you: userPro, country: countryName, them: countryPro, n: totalCountries })}
          </p>
        </div>

        <p className="result__disclaimer">{t('result.disclaimer')}</p>

        <div className="result__actions">
          <Button variant="primary" onClick={share}>{t('result.share')}</Button>
          <Button variant="ghost" onClick={() => navigate('/map')}>{t('result.see_map')}</Button>
          {!readOnly && (
            <Button variant="ghost" onClick={onChangeAnswers}>{t('result.change')}</Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setContactOpen(true)}
            disabled={!isSupabaseConfigured()}
            title={isSupabaseConfigured() ? undefined : t('contact.disabled')}
          >
            {t('result.policy')}
          </Button>
        </div>
      </div>

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultCountryIso3={country?.iso3}
      />
    </section>
  )
}

export function buildShareUrl(iso3, reg, pro, lang) {
  const params = new URLSearchParams({ c: iso3 ?? '', reg: String(reg), pro: String(pro) })
  if (lang === 'es' || lang === 'en') params.set('l', lang)
  return `${window.location.origin}/r?${params.toString()}`
}
