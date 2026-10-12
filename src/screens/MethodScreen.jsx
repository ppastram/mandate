import { useLang } from '../i18n/LangProvider.jsx'
import './MethodScreen.css'

export default function MethodScreen() {
  const { t } = useLang()

  const sources = [
    { key: 'aiReg',  url: 'https://airegulationmap.org' },
    { key: 'oxford', url: 'https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/' },
    { key: 'ilia',   url: 'https://www.cepal.org/es/publicaciones/82514-indice-latinoamericano-inteligencia-artificial-ilia-2025' },
    { key: 'ne',     url: 'https://www.naturalearthdata.com/' },
  ]

  return (
    <section className="method">
      <div className="method__container">

        <header className="method__head">
          <h1 className="method__title">{t('method.title')}</h1>
          <p className="method__intro">{t('method.intro')}</p>
        </header>

        <section className="method__block" aria-labelledby="m-sources">
          <h2 id="m-sources" className="method__h2">{t('method.sources.title')}</h2>
          <ul className="method__sources">
            {sources.map(({ key, url }) => (
              <li key={key} className="method__source">
                <a className="method__source-link" href={url} target="_blank" rel="noreferrer">
                  {t(`method.sources.${key}.name`)}
                </a>
                <span className="method__source-license">{t(`method.sources.${key}.license`)}</span>
                <p className="method__source-desc">{t(`method.sources.${key}.desc`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="method__block" aria-labelledby="m-scores">
          <h2 id="m-scores" className="method__h2">{t('method.scores.title')}</h2>
          <p className="method__lead">{t('method.scores.lead')}</p>
          <ul className="method__list">
            <li>{t('method.scores.regulation')}</li>
            <li>{t('method.scores.promotion')}</li>
          </ul>
        </section>

        <section className="method__block method__block--limits" aria-labelledby="m-limits">
          <h2 id="m-limits" className="method__h2">{t('method.limits.title')}</h2>
          <ol className="method__limits">
            <li>{t('method.limits.sample')}</li>
            <li>{t('method.limits.device')}</li>
            <li>{t('method.limits.percentiles')}</li>
            <li>{t('method.limits.pipeline')}</li>
          </ol>
        </section>

        <section className="method__block" aria-labelledby="m-storage">
          <h2 id="m-storage" className="method__h2">{t('method.storage.title')}</h2>
          <p className="method__body">{t('method.storage.body')}</p>
        </section>

      </div>
    </section>
  )
}
