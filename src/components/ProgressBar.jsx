import { STATEMENTS } from '../i18n/statements.js'
import { useLang } from '../i18n/LangProvider.jsx'
import './ProgressBar.css'

/**
 * Six segments following the spec: 3 blue (regulation) + 3 orange (promotion).
 * Already-answered + current segments are filled solid; unanswered ones are muted.
 */
export default function ProgressBar({ current, answers }) {
  const { t } = useLang()
  return (
    <div className="progress-bar">
      <span className="progress-bar__label">
        {t('quiz.progress', { n: current + 1 })}
      </span>
      <ol className="progress-bar__segments" aria-hidden="true">
        {STATEMENTS.map((s, i) => {
          const answered = answers[i] !== null && answers[i] !== undefined
          const isCurrent = i === current
          const tone = s.axis === 'regulation' ? 'reg' : 'pro'
          const state = isCurrent ? 'current' : (answered ? 'done' : 'empty')
          return (
            <li
              key={s.id}
              className={`progress-bar__seg progress-bar__seg--${tone} progress-bar__seg--${state}`}
            />
          )
        })}
      </ol>
    </div>
  )
}
