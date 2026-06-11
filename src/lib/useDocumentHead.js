import { useEffect } from 'react'
import { useData } from '../data-context.jsx'
import { useLang } from '../lang.jsx'
import { buildLanguageLinks, buildLanguageSeo, buildSeo, SEO_THEME_COLOR } from './seo.js'

function upsertMeta(selector, attributes, content) {
  let node = document.head.querySelector(selector)
  if (!content) {
    node?.remove()
    return
  }
  if (!node) {
    node = document.createElement('meta')
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value))
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

function upsertLink(selector, attributes, href) {
  let node = document.head.querySelector(selector)
  if (!href) {
    node?.remove()
    return
  }
  if (!node) {
    node = document.createElement('link')
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value))
    document.head.appendChild(node)
  }
  node.setAttribute('href', href)
}

export function useDocumentHead() {
  const { SITE } = useData()
  const { lang } = useLang()

  useEffect(() => {
    if (typeof document === 'undefined') return
    const hasLanguageRoute = /^\/(?:en|zh)(?:\/|$)/.test(window.location.pathname)
    const seo = hasLanguageRoute ? buildLanguageSeo(SITE, lang) : buildSeo(SITE, lang)

    document.title = seo.title
    document.documentElement.lang = lang
    upsertMeta('meta[name="description"]', { name: 'description' }, seo.description)
    upsertMeta('meta[name="robots"]', { name: 'robots' }, 'index, follow')
    upsertMeta('meta[name="theme-color"]', { name: 'theme-color' }, SEO_THEME_COLOR)
    upsertMeta(
      'meta[name="google-site-verification"]',
      { name: 'google-site-verification' },
      seo.googleSiteVerification,
    )
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website')
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, seo.title)
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, seo.description)
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, seo.siteName)
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, seo.locale)
    upsertMeta(
      'meta[property="og:locale:alternate"]',
      { property: 'og:locale:alternate' },
      seo.localeAlternate,
    )
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, seo.canonical)
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, seo.image)
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, seo.imageAlt)
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, seo.imageWidth)
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, seo.imageHeight)
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, seo.title)
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, seo.description)
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, seo.image)
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, seo.imageAlt)
    upsertLink('link[rel="canonical"]', { rel: 'canonical' }, seo.canonical)

    const languageLinks = hasLanguageRoute ? buildLanguageLinks(SITE) : []
    ;['en', 'zh', 'x-default'].forEach(hreflang => {
      const link = languageLinks.find(item => item.hreflang === hreflang)
      upsertLink(
        `link[rel="alternate"][hreflang="${hreflang}"]`,
        { rel: 'alternate', hreflang },
        link?.href || '',
      )
    })
  }, [SITE, lang])
}
