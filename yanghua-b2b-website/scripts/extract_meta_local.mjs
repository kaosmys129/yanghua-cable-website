import fs from 'node:fs'
import path from 'node:path'

const reportDir = path.join(process.cwd(), 'reports')
fs.mkdirSync(reportDir, { recursive: true })
const reportFile = path.join(reportDir, 'meta_tags_local_report.txt')

// 初始覆盖的核心页面
const urls = [
  // 首页
  'http://localhost:3000/',
  'http://localhost:3000/es',
  // About / Servicios / Contact / 法务页
  'http://localhost:3000/about',
  'http://localhost:3000/es/acerca-de',
  'http://localhost:3000/services',
  'http://localhost:3000/es/servicios',
  'http://localhost:3000/contact',
  'http://localhost:3000/es/contacto',
  'http://localhost:3000/privacy',
  'http://localhost:3000/es/privacidad',
  'http://localhost:3000/terms',
  'http://localhost:3000/es/terminos',
  // Solutions 列表与示例详情
  'http://localhost:3000/solutions',
  'http://localhost:3000/es/soluciones',
  'http://localhost:3000/solutions/new-energy',
  'http://localhost:3000/es/soluciones/new-energy',
  // Products 列表/分类/示例详情
  'http://localhost:3000/products',
  'http://localhost:3000/es/productos',
  'http://localhost:3000/products/category/general',
  'http://localhost:3000/es/productos/categoria/general',
  'http://localhost:3000/products/flexible-busbar-2000a',
  'http://localhost:3000/es/productos/flexible-busbar-2000a',
  // Projects 列表与示例详情
  'http://localhost:3000/projects',
  'http://localhost:3000/es/proyectos',
  'http://localhost:3000/projects/1',
  'http://localhost:3000/es/proyectos/1',
  // Articles 列表
  'http://localhost:3000/articles',
  'http://localhost:3000/es/articulos',
]

const extract = (html, pattern) => {
  const m = html.match(pattern)
  return m?.[1] || 'N/A'
}

const lines = []

// 从 sitemap 动态扩展文章/产品/项目详情的实例URL
try {
  const smRes = await fetch('http://localhost:3000/sitemap.xml')
  const smXml = await smRes.text()
  const locs = Array.from(smXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(m => m[1])
  const toLocal = (u) => u.replace('https://www.yhflexiblebusbar.com', 'http://localhost:3000')
  const addSome = (arr, predicate, limit = 4) => {
    const picked = arr.filter(predicate).slice(0, limit).map(toLocal)
    for (const u of picked) urls.push(u)
  }
  // 文章详情（英/西）
  addSome(locs, u => /\/articles\//.test(u), 4)
  addSome(locs, u => /\/es\/articulos\//.test(u), 4)
  // 产品详情（英/西）
  addSome(locs, u => /\/products\/[A-Za-z0-9-]+$/.test(u), 4)
  addSome(locs, u => /\/es\/productos\/[A-Za-z0-9-]+$/.test(u), 4)
  // 项目详情（英/西）
  addSome(locs, u => /\/projects\/\d+$/.test(u), 4)
  addSome(locs, u => /\/es\/proyectos\/\d+$/.test(u), 4)
} catch (e) {
  // 忽略 sitemap 扩展失败，保留初始URL集
}

for (const url of urls) {
  lines.push('====================')
  lines.push(`URL: ${url}`)
  const res = await fetch(url)
  lines.push(`HEAD: ${res.status} ${res.statusText}`)
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
}

// Local sitemap check
lines.push('\nSitemap check:')
const smUrl = 'http://localhost:3000/sitemap.xml'
try {
  const smRes = await fetch(smUrl)
  lines.push(`sitemap HEAD: ${smRes.status} ${smRes.statusText}`)
  const smXml = await smRes.text()
  // 本地 sitemap 使用生产域名作为绝对URL，统计时兼容两种域名
  const prodDomain = 'https://www.yhflexiblebusbar.com'
  const localDomain = 'http://localhost:3000'
  const enCount = ((smXml.match(new RegExp(`${prodDomain}/en`, 'g')) || []).length)
    + ((smXml.match(new RegExp(`${localDomain}/en`, 'g')) || []).length)
  const totalCount = ((smXml.match(new RegExp(`${prodDomain}/`, 'g')) || []).length)
    + ((smXml.match(new RegExp(`${localDomain}/`, 'g')) || []).length)
  lines.push(`local sitemap occurrences with /en: ${enCount}`)
  lines.push(`local sitemap total URL count: ${totalCount}`)
} catch (e) {
  lines.push(`sitemap fetch error: ${e?.message || e}`)
}

fs.writeFileSync(reportFile, lines.join('\n'), 'utf8')
console.log(`Saved: ${reportFile}`)