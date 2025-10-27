const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next-intl').Config} */
const config = {
  locales: ['en', 'es'],
  defaultLocale: 'en',
  // 使用 always：默认语言(en)也带前缀 /en，避免 / 与 /en 并存导致 canonical 冲突，并满足统一前缀策略
  localePrefix: 'always',
  // 使用 pathnames 将路由层保持英文段，但对外URL在西语使用翻译段
  pathnames: {
    '/': '/',
    '/about': {
      en: '/about',
      es: '/acerca-de'
    },
    '/products': {
      en: '/products',
      es: '/productos'
    },
    '/solutions': {
      en: '/solutions',
      es: '/soluciones'
    },
    '/services': {
      en: '/services',
      es: '/servicios'
    },
    '/projects': {
      en: '/projects',
      es: '/proyectos'
    },
    '/contact': {
      en: '/contact',
      es: '/contacto'
    },
    '/articles': {
      en: '/articles',
      es: '/articulos'
    },
    // 分类页
    '/products/category': {
      en: '/products/category',
      es: '/productos/categoria'
    },
    // 动态路由映射
    '/products/[id]': { en: '/products/[id]', es: '/productos/[id]' },
    '/solutions/[id]': { en: '/solutions/[id]', es: '/soluciones/[id]' },
    '/projects/[id]': { en: '/projects/[id]', es: '/proyectos/[id]' },
    '/articles/[slug]': { en: '/articles/[slug]', es: '/articulos/[slug]' },
    '/products/category/[name]': { en: '/products/category/[name]', es: '/productos/categoria/[name]' }
  }
};

module.exports = config;