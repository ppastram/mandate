import { useMemo, useRef, useState } from 'react'
import { feature } from 'topojson-client'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { useLang } from '../i18n/LangProvider.jsx'
import './WorldMap.css'

const VIEW_W = 1000
const VIEW_H = 488
const ANTARCTICA_ID = '010'

const BLUES   = ['#DCE3FA', '#B3C1F3', '#7F95EA', '#4A66DE', '#1D3FD1']
const ORANGES = ['#FBE3D6', '#F4C2A6', '#E8946A', '#D9662F', '#C4420A']
const VOTES   = ['#DCFCE7', '#BBF7D0', '#86EFAC', '#22C55E', '#15803D']
const NO_DATA = '#E6E6E1'
const DIFF = {
  strongBlue:   '#1D3FD1',
  lightBlue:    '#7F95EA',
  balanced:     '#D5D5D0',
  lightOrange:  '#E8946A',
  strongOrange: '#C4420A',
}

const VOTE_THRESHOLD = 30

export function colorFor(country, layer, voteN) {
  const reg = country?.gov_profile?.regulation
  const pro = country?.gov_profile?.promotion

  if (layer === 'regulation') {
    if (!Number.isFinite(reg)) return NO_DATA
    return BLUES[Math.min(4, Math.floor(reg / 20))]
  }
  if (layer === 'promotion') {
    if (!Number.isFinite(pro)) return NO_DATA
    return ORANGES[Math.min(4, Math.floor(pro / 20))]
  }
  if (layer === 'votes') {
    if (!Number.isFinite(voteN) || voteN < VOTE_THRESHOLD) return NO_DATA
    if (voteN <   50) return VOTES[0]
    if (voteN <  100) return VOTES[1]
    if (voteN <  250) return VOTES[2]
    if (voteN < 1000) return VOTES[3]
    return VOTES[4]
  }
  // difference = promotion − regulation
  if (!Number.isFinite(reg) || !Number.isFinite(pro)) return NO_DATA
  const d = pro - reg
  if (d <  -15) return DIFF.strongBlue
  if (d <   -5) return DIFF.lightBlue
  if (d <=   5) return DIFF.balanced
  if (d <=  15) return DIFF.lightOrange
  return DIFF.strongOrange
}

export const LAYER_SWATCHES = {
  regulation: BLUES,
  promotion:  ORANGES,
  difference: [DIFF.strongBlue, DIFF.lightBlue, DIFF.balanced, DIFF.lightOrange, DIFF.strongOrange],
  votes:      VOTES,
}

export const NO_DATA_COLOR = NO_DATA
export const VOTES_THRESHOLD = VOTE_THRESHOLD

export default function WorldMap({
  topology,
  countries,
  layer,
  selectedIso3,
  onSelect,
  resultsByIso3,  // Map<iso3, { n, reg_avg, pro_avg, ... }> — used by the "votes" layer
}) {
  const { t, displayCountry } = useLang()
  const [hover, setHover] = useState(null)
  const svgRef = useRef(null)

  // Project and generate SVG paths once per topology.
  const paths = useMemo(() => {
    if (!topology) return null
    const fc = feature(topology, topology.objects.countries)
    const features = fc.features.filter((f) => String(f.id) !== ANTARCTICA_ID)
    // d3-geo + topojson-client handle antimeridian cutting automatically.
    const projection = geoEqualEarth().fitSize(
      [VIEW_W, VIEW_H],
      { type: 'FeatureCollection', features },
    )
    const pathGen = geoPath(projection)
    return features.map((f) => ({
      numeric: String(f.id),
      topoName: f.properties?.name ?? null,
      d: pathGen(f),
    }))
  }, [topology])

  // ISO numeric → country record (from the slim index)
  const byNumeric = useMemo(() => {
    const m = new Map()
    for (const c of countries ?? []) m.set(c.numeric, c)
    return m
  }, [countries])

  // Selected country's numeric id (if any)
  const selectedNumeric = useMemo(() => {
    if (!selectedIso3 || !countries) return null
    const c = countries.find((x) => x.iso3 === selectedIso3)
    return c?.numeric ?? null
  }, [selectedIso3, countries])

  if (!paths) {
    return <div className="world-map world-map--loading">{t('map.loading')}</div>
  }

  const handleMove = (e, numeric) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({
      numeric,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const hoveredCountry = hover ? byNumeric.get(hover.numeric) : null
  const hoveredPath    = hover ? paths.find((p) => p.numeric === hover.numeric) : null
  const hoveredName    = hoveredCountry
    ? displayCountry(hoveredCountry.iso2, hoveredCountry.name)
    : (hoveredPath?.topoName ?? '')

  // Position tooltip inside the container with simple edge-flip
  const tooltipStyle = hover ? tooltipPosition(hover, svgRef.current) : null

  return (
    <div className="world-map">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="world-map__svg"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={t('map.title')}
      >
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} className="world-map__ocean" />
        <g>
          {paths.map((p) => {
            const c = byNumeric.get(p.numeric)
            const voteN = c && resultsByIso3 ? resultsByIso3.get(c.iso3)?.n : undefined
            const isSelected = selectedNumeric !== null && p.numeric === selectedNumeric
            const isHovered  = hover?.numeric === p.numeric
            const fill = isSelected ? '#FFC800' : colorFor(c, layer, voteN)
            return (
              <path
                key={p.numeric}
                d={p.d}
                fill={fill}
                className={
                  'world-map__country' +
                  (isSelected ? ' world-map__country--selected' : '') +
                  (isHovered  ? ' world-map__country--hovered'  : '')
                }
                onMouseMove={(e) => handleMove(e, p.numeric)}
                onFocus={(e) => handleMove(e, p.numeric)}
                onClick={() => c && onSelect(c.iso3)}
                tabIndex={c ? 0 : -1}
                aria-label={hoveredName}
              />
            )
          })}
        </g>
      </svg>

      {hover && tooltipStyle && (
        <div className="world-map__tt" style={tooltipStyle} role="status">
          <div className="world-map__tt-name">{hoveredName}</div>
          {hoveredCountry?.gov_profile ? (
            <>
              <div className="world-map__tt-row">
                <span className="world-map__tt-k">{t('map.score.regulation')}</span>
                <span className="world-map__tt-v">{hoveredCountry.gov_profile.regulation}</span>
              </div>
              <div className="world-map__tt-row">
                <span className="world-map__tt-k">{t('map.score.promotion')}</span>
                <span className="world-map__tt-v">{hoveredCountry.gov_profile.promotion}</span>
              </div>
              {resultsByIso3 && (
                <div className="world-map__tt-row">
                  <span className="world-map__tt-k">{t('map.score.votes')}</span>
                  <span className="world-map__tt-v">
                    {resultsByIso3.get(hoveredCountry.iso3)?.n ?? 0}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="world-map__tt-nodata">{t('map.legend.nodata')}</div>
          )}
        </div>
      )}
    </div>
  )
}

function tooltipPosition(hover, svgEl) {
  const TT_W = 160
  const TT_H = 76
  const OFFSET = 12
  const containerW = svgEl?.clientWidth ?? VIEW_W
  const containerH = svgEl?.clientHeight ?? VIEW_H

  let left = hover.x + OFFSET
  let top  = hover.y + OFFSET
  if (left + TT_W > containerW) left = hover.x - TT_W - OFFSET
  if (top + TT_H > containerH)  top  = hover.y - TT_H - OFFSET
  if (left < 0) left = 0
  if (top  < 0) top  = 0
  return { left, top }
}
