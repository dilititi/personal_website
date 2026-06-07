import { pick } from '../data.js'

export const SEO_DEFAULT_LANG = 'en'
export const SEO_THEME_COLOR = '#ebe2c8'

const LOCALES = {
  en: 'en_US',
  zh: 'zh_CN',
}

export function languageFromUrl(url = '/') {
  try {
    const pathname = new URL(url, 'http://localhost').pathname
    return pathname.split('/').filter(Boolean)[0] === 'zh' ? 'zh' : SEO_DEFAULT_LANG
  } catch {
    return SEO_DEFAULT_LANG
  }
}

function plainText(value) {
  return String(value ?? '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function shortTitleText(value, maxLength = 64) {
  const text = plainText(value)
  if (!text) return ''

  const sentenceEnd = text.search(/[.!?。！？]/)
  if (sentenceEnd >= 0 && sentenceEnd < maxLength) {
    return text.slice(0, sentenceEnd + 1)
  }
  if (text.length <= maxLength) return text

  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

function absoluteImage(siteUrl, portrait) {
  const image = String(portrait ?? '').trim()
  if (!image || !siteUrl) return image
  if (/^[a-z][a-z\d+.-]*:/i.test(image) || image.startsWith('//')) return image

  try {
    const base = `${siteUrl.replace(/\/+$/, '')}/`
    return new URL(image.replace(/^\/+/, ''), base).href
  } catch {
    return image
  }
}

export function buildSeo(site = {}, lang = SEO_DEFAULT_LANG) {
  const activeLang = lang === 'zh' ? 'zh' : SEO_DEFAULT_LANG
  const alternateLang = activeLang === 'en' ? 'zh' : 'en'
  const siteName = plainText(pick(site?.name, activeLang))
  const tagline = plainText(pick(site?.tagline, activeLang))
  const titleDetail = shortTitleText(tagline || pick(site?.role, activeLang))
  const canonical = String(site?.url ?? '')
    .trim()
    .replace(/\/+$/, '')

  return {
    title: [siteName, titleDetail].filter(Boolean).join(' · '),
    description: tagline,
    canonical,
    image: absoluteImage(canonical, site?.portrait),
    siteName,
    locale: LOCALES[activeLang],
    localeAlternate: LOCALES[alternateLang],
  }
}

export function buildLanguageSeo(site = {}, lang = SEO_DEFAULT_LANG) {
  const seo = buildSeo(site, lang)
  const siteRoot = String(site?.url ?? '')
    .trim()
    .replace(/\/+$/, '')
  return {
    ...seo,
    canonical: siteRoot ? `${siteRoot}/${lang === 'zh' ? 'zh' : 'en'}/` : '',
  }
}

export function buildLanguageLinks(site = {}) {
  const siteRoot = String(site?.url ?? '')
    .trim()
    .replace(/\/+$/, '')
  if (!siteRoot) return []
  return [
    { hreflang: 'en', href: `${siteRoot}/en/` },
    { hreflang: 'zh', href: `${siteRoot}/zh/` },
    { hreflang: 'x-default', href: `${siteRoot}/en/` },
  ]
}
