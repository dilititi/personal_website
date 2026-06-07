import React from 'react'
import { renderToString } from 'react-dom/server.edge'
import App from './App.jsx'
import { SITE } from './data.js'
import {
  buildLanguageLinks,
  buildLanguageSeo,
  buildSeo,
  languageFromUrl,
  SEO_THEME_COLOR,
} from './lib/seo.js'

function seoHeadElements(site, lang, languageRoute) {
  const seo = languageRoute ? buildLanguageSeo(site, lang) : buildSeo(site, lang)
  const elements = [
    { type: 'meta', props: { name: 'description', content: seo.description } },
    { type: 'meta', props: { name: 'robots', content: 'index, follow' } },
    { type: 'meta', props: { name: 'theme-color', content: SEO_THEME_COLOR } },
    { type: 'meta', props: { property: 'og:type', content: 'website' } },
    { type: 'meta', props: { property: 'og:title', content: seo.title } },
    { type: 'meta', props: { property: 'og:description', content: seo.description } },
    { type: 'meta', props: { property: 'og:site_name', content: seo.siteName } },
    { type: 'meta', props: { property: 'og:locale', content: seo.locale } },
    {
      type: 'meta',
      props: { property: 'og:locale:alternate', content: seo.localeAlternate },
    },
    { type: 'meta', props: { name: 'twitter:card', content: 'summary_large_image' } },
    { type: 'meta', props: { name: 'twitter:title', content: seo.title } },
    { type: 'meta', props: { name: 'twitter:description', content: seo.description } },
  ]

  if (seo.canonical) {
    elements.push(
      { type: 'link', props: { rel: 'canonical', href: seo.canonical } },
      { type: 'meta', props: { property: 'og:url', content: seo.canonical } },
    )
  }
  if (seo.image) {
    elements.push(
      { type: 'meta', props: { property: 'og:image', content: seo.image } },
      { type: 'meta', props: { name: 'twitter:image', content: seo.image } },
    )
  }
  buildLanguageLinks(site).forEach(link => {
    elements.push({ type: 'link', props: { rel: 'alternate', ...link } })
  })

  return { seo, elements: new Set(elements) }
}

export async function prerender({ url = '/' } = {}) {
  const lang = languageFromUrl(url)
  const pathname = new URL(url, 'http://localhost').pathname
  const languageRoute = /^\/(?:en|zh)(?:\/|$)/.test(pathname)
  const { seo, elements } = seoHeadElements(SITE, lang, languageRoute)
  const html = renderToString(
    <React.StrictMode>
      <App prerendered initialLang={lang} />
    </React.StrictMode>,
  )

  return {
    html,
    links: new Set(['/en', '/zh']),
    head: {
      lang,
      title: seo.title,
      elements,
    },
  }
}
