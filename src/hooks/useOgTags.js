import { useEffect } from 'react'

/**
 * Updates document.title + <meta property="og:*"> live for SPA navigation.
 * This covers in-app previews (same browser session); social scrapers get
 * the server-rendered tags from api/share.js.
 */
export function useOgTags({ title, description, image, url, type = 'website' }) {
  useEffect(() => {
    const prev = document.title
    if (title) document.title = title
    setMeta('property', 'og:type',        type)
    setMeta('property', 'og:title',       title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image',       image)
    setMeta('property', 'og:url',         url)
    setMeta('name',     'twitter:card',   image ? 'summary_large_image' : 'summary')
    setMeta('name',     'twitter:title',  title)
    setMeta('name',     'twitter:description', description)
    setMeta('name',     'twitter:image',  image)
    return () => { document.title = prev }
  }, [title, description, image, url, type])
}

function setMeta(attr, key, value) {
  if (!value) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', String(value))
}
