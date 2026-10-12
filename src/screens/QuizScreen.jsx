import { useState } from 'react'
import { useLang } from '../i18n/LangProvider.jsx'
import { STATEMENTS, ANSWERS } from '../i18n/statements.js'
import { useCountryDetail } from '../hooks/useCountryDetail.js'
import ProgressBar from '../components/ProgressBar.jsx'
import AnswerOption from '../components/AnswerOption.jsx'
import Button from '../components/Button.jsx'
import Tag from '../components/Tag.jsx'
import CountryPanel from '../components/CountryPanel.jsx'
import './QuizScreen.css'

const IN_PROGRESS_REGEX = /\b(pending|draft|proposed|bill)\b/i

export default function QuizScreen({
  country,
  currentIndex,
  answers,
  onAnswer,
  onPrev,
  onNext,
}) {
  const { t, lang, displayCountry } = useLang()
  const statement = STATEMENTS[currentIndex]
  const answered  = answers[currentIndex] !== null && answers[currentIndex] !== undefined
  const isLast    = currentIndex === STATEMENTS.length - 1
  const tone      = statement.axis  // 'regulation' | 'promotion'
  const countryName = country ? displayCountry(country.iso2, country.name) : ''

  return (
    <div className="quiz-screen">
      <div className="quiz-screen__container">

        <div className="quiz-screen__layout">

          <main className="quiz-screen__main">
            <ProgressBar current={currentIndex} answers={answers} />

            <h2 className="quiz-screen__question" key={statement.id}>
              {statement[lang]}
            </h2>

            <div className="quiz-screen__options" role="group" aria-label="Likert">
              {ANSWERS.map((opt) => (
                <AnswerOption
                  key={opt.value}
                  icon={opt.icon}
                  label={opt[lang]}
                  selected={answers[currentIndex] === opt.value}
                  onClick={() => onAnswer(opt.value)}
                />
              ))}
            </div>

            <div className="quiz-screen__nav">
              <Button
                variant="ghost"
                onClick={onPrev}
                disabled={currentIndex === 0}
              >
                {t('quiz.prev')}
              </Button>
              <Button
                variant="primary"
                onClick={onNext}
                disabled={!answered}
              >
                {isLast ? t('quiz.see_result') : t('quiz.next')}
              </Button>
            </div>

            <p className="quiz-screen__disclaimer">{t('quiz.disclaimer')}</p>
          </main>

          <div className="quiz-screen__sidebar">
            <CountryPanel country={country} tone={tone} />
          </div>
        </div>

        <ExistsBand country={country} tone={tone} countryName={countryName} />

      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */

function ExistsBand({ country, tone, countryName }) {
  const { t } = useLang()
  const detail = useCountryDetail(country?.iso3 ?? null)
  const [expanded, setExpanded] = useState(false)

  const confKey = country?.confidence ? `confidence.${country.confidence}` : null
  const source = (
    <p className="exists__source">
      {t('exists.source', { confidence: confKey ? t(confKey) : '' })}
    </p>
  )

  const header = (
    <div className="exists__head">
      <h3 className="exists__title">
        {t('exists.title', { country: countryName })}
      </h3>
    </div>
  )

  if (!country || detail === null) {
    return (
      <section className="exists">
        {header}
        <div className="exists__skeleton" />
        {source}
      </section>
    )
  }

  if (tone === 'promotion') {
    const note = detail.notes?.promotion_note
    return (
      <section className="exists">
        {header}
        <div className="exists__promo">
          {note ? <p className="exists__promo-text">{note}</p>
                : <p className="exists__empty">{t('exists.empty')}</p>}
        </div>
        {source}
      </section>
    )
  }

  // regulation
  const laws = Array.isArray(detail.key_laws) ? detail.key_laws : []
  if (laws.length === 0) {
    return (
      <section className="exists">
        {header}
        <p className="exists__empty">{t('exists.empty')}</p>
        {source}
      </section>
    )
  }

  const visible = expanded ? laws : laws.slice(0, 4)
  return (
    <section className="exists">
      <div className="exists__head">
        <h3 className="exists__title">
          {t('exists.title', { country: countryName })}
        </h3>
        {laws.length > 4 && (
          <button
            type="button"
            className="exists__toggle"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t('exists.show_less') : t('exists.show_all')}
          </button>
        )}
      </div>
      <ul className="exists__list">
        {visible.map((text, i) => {
          const inProgress = IN_PROGRESS_REGEX.test(text)
          return (
            <li key={i} className="exists__item">
              <p className="exists__item-text">{text}</p>
              {inProgress && (
                <Tag type="circular">{t('exists.in_progress')}</Tag>
              )}
            </li>
          )
        })}
      </ul>
      {source}
    </section>
  )
}
