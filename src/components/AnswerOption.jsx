import './AnswerOption.css'

const ICONS = {
  'strongly-against': (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  against: (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 13L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  neutral: (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  favor: (
    <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5.5 10.5L8.5 13.5L14.5 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'strongly-favor': (
    <svg viewBox="0 0 22 20" fill="none" width="18" height="16" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 10.5L8 13.5L14 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 10.5L15 13.5L21 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  ),
}

export default function AnswerOption({ icon, label, selected = false, onClick }) {
  return (
    <button
      type="button"
      className={`answer-option${selected ? ' answer-option--selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="answer-option__icon">{ICONS[icon]}</span>
      <span className="answer-option__label">{label}</span>
    </button>
  )
}
