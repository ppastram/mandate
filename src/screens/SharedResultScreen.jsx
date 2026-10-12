import { useSearchParams, useNavigate } from 'react-router-dom'
import { useLang } from '../i18n/LangProvider.jsx'
import { useCountries } from '../hooks/useCountries.js'
import ResultScreen from './ResultScreen.jsx'
import Button from '../components/Button.jsx'

/**
 * /r?c=COL&reg=83&pro=42 — read-only, with a "Vote" button that sends to /.
 */
export default function SharedResultScreen() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const countries = useCountries()

  const iso3 = (params.get('c') || '').toUpperCase()
  const reg  = clamp(Number(params.get('reg')))
  const pro  = clamp(Number(params.get('pro')))

  if (!Array.isArray(countries)) {
    return <p style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--text-muted)' }}>{t('shared.loading')}</p>
  }

  const country = countries.find((c) => c.iso3 === iso3) ?? null
  if (!country) {
    return (
      <section style={{ padding: 'var(--sp-10) var(--sp-6)', textAlign: 'center' }}>
        <p style={{ marginBottom: 'var(--sp-4)', color: 'var(--text-secondary)' }}>
          {t('pick.empty')}: <code>{iso3}</code>
        </p>
        <Button variant="primary" onClick={() => navigate('/')}>{t('shared.vote')}</Button>
      </section>
    )
  }

  return (
    <>
      <ResultScreen
        country={country}
        totalCountries={countries.length}
        userReg={reg}
        userPro={pro}
        readOnly
      />
      <div style={{ textAlign: 'center', paddingBottom: 'var(--sp-16)' }}>
        <Button variant="primary" onClick={() => navigate('/')}>
          {t('shared.vote')} →
        </Button>
      </div>
    </>
  )
}

function clamp(v) {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v)))
}
