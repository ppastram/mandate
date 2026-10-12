import { useLang } from '../i18n/LangProvider.jsx'
import './QuadrantChart.css'

const SIZE = 320
const PAD  = 44
const PLOT = SIZE - PAD * 2

const toX = (v) => PAD + (clamp(v) / 100) * PLOT
const toY = (v) => PAD + ((100 - clamp(v)) / 100) * PLOT

function clamp(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0
  return Math.max(0, Math.min(100, v))
}

export default function QuadrantChart({
  userReg, userPro,
  countryReg, countryPro,
  countryName,
  voters,       // optional { reg, pro } — rendered when at least 30 responses exist
}) {
  const { t } = useLang()
  const mid = toX(50)

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="chart__svg"
        role="img"
        aria-label={`Chart: user at ${userReg}, ${userPro}; ${countryName} at ${countryReg}, ${countryPro}`}
      >
        {/* Quadrant tints */}
        <rect x={PAD}         y={PAD}         width={PLOT/2} height={PLOT/2} className="chart__q chart__q--lh"/>
        <rect x={PAD+PLOT/2}  y={PAD}         width={PLOT/2} height={PLOT/2} className="chart__q chart__q--hh"/>
        <rect x={PAD}         y={PAD+PLOT/2}  width={PLOT/2} height={PLOT/2} className="chart__q chart__q--ll"/>
        <rect x={PAD+PLOT/2}  y={PAD+PLOT/2}  width={PLOT/2} height={PLOT/2} className="chart__q chart__q--hl"/>

        {/* Mid lines */}
        <line x1={mid} y1={PAD} x2={mid} y2={SIZE-PAD} className="chart__midline"/>
        <line x1={PAD} y1={mid} x2={SIZE-PAD} y2={mid} className="chart__midline"/>

        {/* Outer frame */}
        <rect x={PAD} y={PAD} width={PLOT} height={PLOT} className="chart__frame"/>

        {/* Quadrant labels */}
        <text x={PAD+PLOT/4}   y={PAD+18} textAnchor="middle" className="chart__qlabel">{t('quadrant.lh')}</text>
        <text x={PAD+PLOT*3/4} y={PAD+18} textAnchor="middle" className="chart__qlabel">{t('quadrant.hh')}</text>
        <text x={PAD+PLOT/4}   y={SIZE-PAD-8} textAnchor="middle" className="chart__qlabel">{t('quadrant.ll')}</text>
        <text x={PAD+PLOT*3/4} y={SIZE-PAD-8} textAnchor="middle" className="chart__qlabel">{t('quadrant.hl')}</text>

        {/* Axis labels */}
        <text x={SIZE/2} y={SIZE-12} textAnchor="middle" className="chart__axis">
          {t('chart.axis.reg')}
        </text>
        <text
          x={14} y={SIZE/2}
          textAnchor="middle"
          className="chart__axis"
          transform={`rotate(-90 14 ${SIZE/2})`}
        >
          {t('chart.axis.pro')}
        </text>

        {/* Country dot (bottom layer) */}
        <circle
          cx={toX(countryReg)} cy={toY(countryPro)}
          r="6"
          className="chart__dot chart__dot--country"
        />

        {/* Voters dot — only when the country has ≥30 responses */}
        {voters && (
          <circle
            cx={toX(voters.reg)} cy={toY(voters.pro)}
            r="6.5"
            className="chart__dot chart__dot--voters"
          />
        )}

        {/* User dot (top layer) */}
        <circle
          cx={toX(userReg)} cy={toY(userPro)}
          r="7.5"
          className="chart__dot chart__dot--user"
        />
      </svg>

      <div className="chart__legend">
        <div className="chart__legend-item">
          <span className="chart__swatch chart__swatch--user" aria-hidden="true" />
          {t('chart.legend.you')}
        </div>
        <div className="chart__legend-item">
          <span className="chart__swatch chart__swatch--country" aria-hidden="true" />
          {t('chart.legend.country', { country: countryName })}
        </div>
        {voters && (
          <div className="chart__legend-item">
            <span className="chart__swatch chart__swatch--voters" aria-hidden="true" />
            {t('chart.legend.voters', { country: countryName })}
          </div>
        )}
      </div>
    </div>
  )
}
