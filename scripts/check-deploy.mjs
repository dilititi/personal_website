import { SITE } from '../src/data.js'
import { buildSeo } from '../src/lib/seo.js'
import { pathToFileURL } from 'node:url'

const SOCIAL_BOTS = {
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  LinkedIn: 'LinkedInBot/1.0',
  X: 'Twitterbot/1.0',
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function metaContent(html, attribute, value) {
  const pair = `${attribute}=["']${escapeRegExp(value)}["']`
  const tag = html.match(new RegExp(`<meta\\s+[^>]*${pair}[^>]*>`, 'i'))?.[0]
  return tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1] || ''
}

export function linkHref(html, rel, extraAttribute = '', extraValue = '') {
  const relPair = `rel=["']${escapeRegExp(rel)}["']`
  const extraPair = extraAttribute ? `${extraAttribute}=["']${escapeRegExp(extraValue)}["']` : ''
  const tag = html.match(new RegExp(`<link\\s+[^>]*${relPair}[^>]*${extraPair}[^>]*>`, 'i'))?.[0]
  return tag?.match(/\bhref=["']([^"']*)["']/i)?.[1] || ''
}

async function get(url, userAgent = '') {
  const response = await fetch(url, {
    headers: userAgent ? { 'user-agent': userAgent } : {},
    redirect: 'follow',
  })
  const body = await response.text()
  return { response, body }
}

function cacheControl(response) {
  return response.headers.get('cache-control') || ''
}

function routeUrl(siteRoot, route) {
  return new URL(route.replace(/^\//, ''), `${siteRoot}/`).href
}

function assertSeoRoute(html, expectedUrl, expectedImage, routeName) {
  assert(/id=["']root["']/.test(html), `${routeName}: missing #root`)
  assert(/landing-masthead/.test(html), `${routeName}: missing prerendered landing content`)
  assert(linkHref(html, 'canonical') === expectedUrl, `${routeName}: canonical mismatch`)
  assert(metaContent(html, 'property', 'og:url') === expectedUrl, `${routeName}: og:url mismatch`)
  for (const [lang, suffix] of [
    ['en', '/en/'],
    ['zh', '/zh/'],
    ['x-default', '/en/'],
  ]) {
    assert(
      linkHref(html, 'alternate', 'hreflang', lang) === routeUrl(SITE.url, suffix),
      `${routeName}: hreflang ${lang} mismatch`,
    )
  }
  assert(metaContent(html, 'property', 'og:title'), `${routeName}: missing og:title`)
  assert(metaContent(html, 'property', 'og:description'), `${routeName}: missing og:description`)
  const actualImage = metaContent(html, 'property', 'og:image')
  assert(actualImage, `${routeName}: missing og:image`)
  assert(
    actualImage === expectedImage,
    `${routeName}: stale og:image; expected "${expectedImage}", got "${actualImage}"`,
  )
  assert(
    metaContent(html, 'property', 'og:image:width') === '1200',
    `${routeName}: og:image:width must be 1200`,
  )
  assert(
    metaContent(html, 'property', 'og:image:height') === '630',
    `${routeName}: og:image:height must be 630`,
  )
  assert(metaContent(html, 'property', 'og:image:alt'), `${routeName}: missing og:image:alt`)
  assert(
    metaContent(html, 'name', 'twitter:card') === 'summary_large_image',
    `${routeName}: twitter card mismatch`,
  )
}

export async function checkDeployment({ skipCache = false } = {}) {
  const siteRoot = String(SITE.url || '').replace(/\/+$/, '')
  assert(siteRoot.startsWith('https://'), 'SITE.url must be a production HTTPS URL')
  const expectedImage = buildSeo(SITE, 'en').image
  assert(expectedImage, 'SITE.ogImage or SITE.portrait must resolve to a social image')

  const routes = [
    { path: '/', canonical: siteRoot, sitemapUrl: `${siteRoot}/`, label: 'root' },
    { path: '/en/', canonical: `${siteRoot}/en/`, sitemapUrl: `${siteRoot}/en/`, label: 'en' },
    { path: '/zh/', canonical: `${siteRoot}/zh/`, sitemapUrl: `${siteRoot}/zh/`, label: 'zh' },
  ]

  let rootHtml = ''
  let rootResponse
  for (const route of routes) {
    const { response, body } = await get(routeUrl(siteRoot, route.path))
    assert(response.ok, `${route.label}: HTTP ${response.status}`)
    assertSeoRoute(body, route.canonical, expectedImage, route.label)
    if (!skipCache) {
      assert(
        /\bno-cache\b|\bmust-revalidate\b/i.test(cacheControl(response)),
        `${route.label}: HTML Cache-Control must revalidate; got "${cacheControl(response)}"`,
      )
    }
    if (route.path === '/') {
      rootHtml = body
      rootResponse = response
    }
    console.log(`ok route ${route.path}`)
  }

  for (const [name, userAgent] of Object.entries(SOCIAL_BOTS)) {
    const { response, body } = await get(siteRoot, userAgent)
    assert(response.ok, `${name}: HTTP ${response.status}`)
    assertSeoRoute(body, siteRoot, expectedImage, name)
    console.log(`ok bot ${name}`)
  }

  const ogImage = metaContent(rootHtml, 'property', 'og:image')
  const imageResponse = await fetch(ogImage)
  const imageBytes = await imageResponse.arrayBuffer()
  assert(imageResponse.ok, `OG image: HTTP ${imageResponse.status}`)
  assert(
    imageResponse.headers.get('content-type')?.startsWith('image/'),
    `OG image: invalid content type "${imageResponse.headers.get('content-type')}"`,
  )
  assert(imageBytes.byteLength > 0 && imageBytes.byteLength < 5_000_000, 'OG image size invalid')
  console.log(`ok OG image ${imageBytes.byteLength} bytes`)

  const robots = await get(`${siteRoot}/robots.txt`)
  assert(robots.response.ok, `robots.txt: HTTP ${robots.response.status}`)
  assert(
    robots.body.includes(`Sitemap: ${siteRoot}/sitemap.xml`),
    'robots.txt: sitemap URL mismatch',
  )
  console.log('ok robots.txt')

  const sitemap = await get(`${siteRoot}/sitemap.xml`)
  assert(sitemap.response.ok, `sitemap.xml: HTTP ${sitemap.response.status}`)
  for (const route of routes) {
    assert(
      sitemap.body.includes(`<loc>${route.sitemapUrl}</loc>`),
      `sitemap.xml: missing ${route.sitemapUrl}`,
    )
  }
  console.log('ok sitemap.xml')

  const assets = [...rootHtml.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map(
    match => match[1],
  )
  assert(assets.length > 0, 'root: no built assets found')
  const assetResponse = await fetch(routeUrl(siteRoot, assets[0]))
  assert(assetResponse.ok, `asset: HTTP ${assetResponse.status}`)
  if (!skipCache) {
    const assetCache = cacheControl(assetResponse)
    assert(/\bimmutable\b/i.test(assetCache), `asset: missing immutable in "${assetCache}"`)
    assert(
      /\bmax-age=31536000\b/i.test(assetCache),
      `asset: missing one-year max-age in "${assetCache}"`,
    )
  }
  console.log(`ok asset ${assets[0]}`)
  console.log(`deployment verified: ${rootResponse.url}`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  checkDeployment({ skipCache: process.argv.includes('--skip-cache') }).catch(error => {
    console.error(`deploy check failed: ${error.message}`)
    process.exitCode = 1
  })
}
