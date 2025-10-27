import fs from 'node:fs'
import path from 'node:path'

const reportDir = path.join(process.cwd(), 'reports')
fs.mkdirSync(reportDir, { recursive: true })
const reportFile = path.join(reportDir, 'meta_tags_report.txt')

const urls = [
  'https://www.yhflexiblebusbar.com/',
  'https://www.yhflexiblebusbar.com/es',
  'https://www.yhflexiblebusbar.com/solutions',
  'https://www.yhflexiblebusbar.com/es/soluciones',
  'https://www.yhflexiblebusbar.com/solutions/new-energy',
  'https://www.yhflexiblebusbar.com/es/soluciones/new-energy',
]

const fetchHeadStatus = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' })
    return `${res.status} ${res.statusText}`
  } catch (e) {
    return `ERR ${e?.message || ''}`
  }
}

const extract = (html, pattern) => {
  const m = html.match(pattern)
  return m?.[1] || 'N/A'
}

const lines = []

for (const url of urls) {
  lines.push('====================')
  lines.push(`URL: ${url}`)
  const head = await fetchHeadStatus(url)
  lines.push(`HEAD: ${head}`)
  const res = await fetch(url, { redirect: 'follow' })
  const finalUrl = res.url
  const html = await res.text()
  const canonical = extract(html, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
  lines.push(`canonical: ${canonical}`)
  for (const lang of ['en', 'es', 'x-default']) {
    const href = extract(html, new RegExp(`<link[^>]*rel=["']alternate["'][^>]*hreflang=["']${lang}["'][^>]*href=["']([^"']+)["'][^>]*>`, 'i'))
    lines.push(`hreflang(${lang}): ${href}`)
  }
  const ogUrl = extract(html, /<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i)
  const ogLocale = extract(html, /<meta[^>]*property=["']og:locale["'][^>]*content=["']([^"']+)["'][^>]*>/i)
  lines.push(`og:url: ${ogUrl}`)
  lines.push(`og:locale: ${ogLocale}`)
  lines.push(`FinalURL: ${finalUrl}`)
}

// Sitemap
lines.push('\nSitemap check:')
const smUrl = 'https://www.yhflexiblebusbar.com/sitemap.xml'
const smHead = await fetchHeadStatus(smUrl)
lines.push(`sitemap HEAD: ${smHead}`)
const smRes = await fetch(smUrl)
const smXml = await smRes.text()
const enCount = (smXml.match(/https:\/\/www\.yhflexiblebusbar\.com\/en/g) || []).length
lines.push(`sitemap occurrences with /en: ${enCount}`)
fs.writeFileSync(reportFile, lines.join('\n'), 'utf8')
console.log(`Saved: ${reportFile}`)