const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next-intl').Config} */
const config = {
  locales: ['en', 'es'],
  defaultLocale: 'en',
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
    }
  }
};

module.exports = config;