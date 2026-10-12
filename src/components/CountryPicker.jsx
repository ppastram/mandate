import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '../i18n/LangProvider.jsx'
import './CountryPicker.css'

/**
 * Searchable combobox. `countries` is the slim index.
 * Variants:
 *   - 'inline'  (step 0, bigger, always-visible list)
 *   - 'header'  (compact trigger that opens a popover)
 */
export default function CountryPicker({
  countries,
  value,
  onChange,
  variant = 'inline',
  suggestedIso3 = null,
  autoFocus = false,
}) {
  const { t, displayCountry } = useLang()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(variant === 'inline')
  const [activeIdx, setActiveIdx] = useState(0)
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  // Localized entries, sorted by localized name
  const items = useMemo(() => {
    if (!Array.isArray(countries)) return []
    const list = countries.map((c) => ({
      ...c,
      display: displayCountry(c.iso2, c.name),
    }))
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' })
    list.sort((a, b) => collator.compare(a.display, b.display))
    return list
  }, [countries, displayCountry])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((c) =>
      c.display.toLowerCase().includes(q) ||
      c.iso3.toLowerCase().includes(q) ||
      c.iso2.toLowerCase().includes(q),
    )
  }, [items, query])

  const suggested = useMemo(
    () => (suggestedIso3 ? items.find((c) => c.iso3 === suggestedIso3) : null),
    [items, suggestedIso3],
  )

  const current = useMemo(
    () => (value ? items.find((c) => c.iso3 === value) : null),
    [items, value],
  )

  // Clamp active index when filtered list changes
  useEffect(() => { setActiveIdx(0) }, [query])

  // Close popover on outside click (header variant only)
  useEffect(() => {
    if (variant !== 'header' || !open) return
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [variant, open])

  // Focus input when opening
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    if (autoFocus) requestAnimationFrame(() => inputRef.current?.focus())
  }, [autoFocus])

  const select = (iso3) => {
    onChange?.(iso3)
    setQuery('')
    if (variant === 'header') setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = filtered[activeIdx]
      if (pick) select(pick.iso3)
    } else if (e.key === 'Escape' && variant === 'header') {
      setOpen(false)
    }
  }

  const listBody = (
    <>
      {suggested && !query && (
        <div className="cp__group">
          <div className="cp__group-label">{t('pick.suggested')}</div>
          <Row
            country={suggested}
            selected={suggested.iso3 === value}
            active={false}
            onSelect={() => select(suggested.iso3)}
          />
        </div>
      )}
      <div className="cp__group">
        <div className="cp__group-label">{t('pick.all')}</div>
        {filtered.length === 0 ? (
          <div className="cp__empty">{t('pick.empty')}</div>
        ) : (
          <ul className="cp__list" role="listbox">
            {filtered.map((c, idx) => (
              <Row
                key={c.iso3}
                country={c}
                selected={c.iso3 === value}
                active={idx === activeIdx}
                onSelect={() => select(c.iso3)}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  )

  if (variant === 'header') {
    const label = current ? current.display : t('pick.search')
    return (
      <div className={`cp cp--header${open ? ' cp--open' : ''}`} ref={rootRef}>
        <button
          type="button"
          className="cp__trigger"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="cp__trigger-label">{label}</span>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M2 4l3.5 3.5L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {open && (
          <div className="cp__popover" role="dialog">
            <input
              ref={inputRef}
              className="cp__input"
              type="search"
              placeholder={t('pick.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="cp__scroll">{listBody}</div>
          </div>
        )}
      </div>
    )
  }

  // inline variant
  return (
    <div className="cp cp--inline" ref={rootRef}>
      <input
        ref={inputRef}
        className="cp__input"
        type="search"
        placeholder={t('pick.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="cp__scroll">{listBody}</div>
    </div>
  )
}

function Row({ country, selected, active, onSelect }) {
  return (
    <li
      className={
        'cp__row' + (selected ? ' cp__row--selected' : '') + (active ? ' cp__row--active' : '')
      }
      role="option"
      aria-selected={selected}
      onMouseDown={(e) => { e.preventDefault(); onSelect() }}
    >
      <span className="cp__name">{country.display}</span>
      <span className="cp__code">{country.iso3}</span>
    </li>
  )
}
