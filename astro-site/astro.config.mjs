// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import remarkGfm from 'remark-gfm';
import vercel from '@astrojs/vercel';
import { buildProductCategoryRedirects } from './src/lib/yanghua/seo-localized-routes.mjs';

function demoteArticleH1() {
  /** @param {any} tree @param {any} file */
  return (tree, file) => {
    const filePath = String(file?.path || file?.history?.[0] || '');
    if (!filePath.includes('/content/articles/')) return;

    /** @param {any} node */
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'heading' && node.depth === 1) {
        node.depth = 2;
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
  };
}

export default defineConfig({
  site: 'https://www.yhflexiblebusbar.com',
  output: 'static',
  trailingSlash: 'never',
  adapter: vercel(),
  // 使用 Vercel adapter，以支持 API 端点的混合部署模式


  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, demoteArticleH1],
    }),
    sitemap({
      // Publish only canonical, locale-prefixed pages. Legacy redirect URLs,
      // utility pages, and status pages must not compete in the sitemap.
      filter: (page) => /^https:\/\/www\.yhflexiblebusbar\.com\/(en|es|pt)(\/|$)/.test(page),
    }),
    react(),
  ],

  redirects: {
    ...buildProductCategoryRedirects(),
    '/': { status: 308, destination: '/en' },
    '/about': { status: 301, destination: '/en/about' },
    '/services': { status: 301, destination: '/en/services' },
    '/contact': { status: 301, destination: '/en/contact' },
    '/blog': { status: 301, destination: '/en/articles' },
    '/blog/flexible-busbar-vs-cable-guide': { status: 301, destination: '/en/articles/flexible-busbar-vs-cable-guide' },
    '/blog/copper-busbar-sizing': { status: 301, destination: '/en/articles/copper-busbar-sizing' },
    '/blog/busbar-installation-tips': { status: 301, destination: '/en/articles/busbar-installation-tips' },
    '/blog/power-distribution-basics': { status: 301, destination: '/en/articles/power-distribution-basics' },
    '/reviews': { status: 301, destination: '/en' },
    '/sitemap.xml': { status: 301, destination: '/sitemap-index.xml' },

    '/products': { status: 301, destination: '/en/products' },
    '/solutions': { status: 301, destination: '/en/solutions' },
    '/projects': { status: 301, destination: '/en/projects' },
    '/articles': { status: 301, destination: '/en/articles' },
    '/en/articles/year-of-the-snake-blessing-prosperity-and-joy-wishing-everyone-a-happy-new-year': { status: 301, destination: '/en/articles/year-of-the-snake-blessing-prosperity-and-joy-wishing-everyone-a-happy-new-year-505792' },
    '/en/articles/work-resumes-with-good-fortune-everything-is-promising': { status: 301, destination: '/en/articles/work-resumes-with-good-fortune-everything-is-promising-532350' },
    '/en/articles/yanghua-insights-chemical-plant-multi-core-cable-connections-causing-problems-vs-flexible-busbar-easy-solutions': { status: 301, destination: '/en/articles/yanghua-insights-chemical-plant-multi-core-cable-connections-causing-problems-vs-flexible-busbar-easy-solutions-532260' },
    '/en/articles/yanghua-insights-multi-parallel-cables-always-have-one-heating-up-first-this-flexible-busbar-cures-current-inequality': { status: 301, destination: '/en/articles/yanghua-insights-multi-parallel-cables-always-have-one-heating-up-first-this-flexible-busbar-cures-current-inequality-505135' },
    '/en/articles/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong': { status: 301, destination: '/en/articles/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong-507559' },
    '/en/articles/first-academic-monograph-in-fire-resistant-cable-field-yanghuasti-chief-technical-expert-du-jinbiao-and-chief-engineer-hu-runyi-participate-in-writing': { status: 301, destination: '/en/articles/first-academic-monograph-in-fire-resistant-cable-field-yanghuasti-chief-technical-expert-du-jinbiao-and-chief-engineer-hu-runyi-participate-in-writing-501651' },
    '/es/projetos/64': { status: 301, destination: '/es/proyectos/64' },
    '/pt/proyectos/64': { status: 301, destination: '/pt/projetos/64' },
    '/es/artigos/hub/custom-busbar-systems': { status: 301, destination: '/es/articulos/hub/custom-busbar-systems' },
    '/en/products/categoria/fire-resistant': { status: 301, destination: '/en/products/category/fire-resistant-cables' },
    '/en/articles/flexible-busbar-industry-solutions-solar-pv-with-complete-manual-download-instructions': { status: 301, destination: '/en/articles/flexible-busbar-industry-solutions-solar-pv-with-complete-manual-download-instructions-517369' },
    '/es/articulos/digital-energy-pioneer-smart-innovation-future-high-current-flexible-busbar-exhibition-highlights-es': { status: 301, destination: '/es/articulos/pionero-de-energia-digital-futuro-de-innovacion-inteligente-destacados-de-la-exposicion-de-busbar-de-alta-corriente-flexible-512155' },
    '/es/articulos/shenzhen-china-southern-power-grid-shenzhen-hong-kong-technology-innovation-co-ltd-leadership-visits-yanghuasti-for-exchange-es': { status: 301, destination: '/es/articulos/liderazgo-de-shenzhen-china-southern-power-grid-shenzhen-hong-kong-technology-innovation-co-ltd-visita-yanghuasti-para-intercambio-508737' },
    '/es/articulos/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong-es': { status: 301, destination: '/en/articles/2024-yanghuasti-dongguan-alliance-partner-high-current-flexible-busbar-product-promotion-tomorrow-coming-strong-507559' },
    '/en/articles/bendicion-del-ano-de-la-serpiente-prosperidad-y-alegria-deseando-a-todos-un-feliz-ano-nuevo-505792': { status: 301, destination: '/es/articulos/bendicion-del-ano-de-la-serpiente-prosperidad-y-alegria-deseando-a-todos-un-feliz-ano-nuevo-505792' },
    '/es/productos/categoria/low-smoke-halogen-free-cables': { status: 301, destination: '/es/productos/categoria/cables-libres-de-humo-y-halogenos' },
    '/es/articulos/as-spring-festival-approaches-yanghuasti-wishes-you-a-happy-new-year-es': { status: 301, destination: '/en/articles/as-spring-festival-approaches-yanghuasti-wishes-you-a-happy-new-year-532956' },
    '/partners': { status: 301, destination: '/en/partners' },
    '/privacy': { status: 301, destination: '/en/privacy' },
    '/en/articles/flexible-busbar-impltement-shenzhen-datacenter-summarzie': { status: 301, destination: '/en/articles' },
    '/es/articulos/a-bug-is-becoming-a-meme-on-the-internet-es': { status: 301, destination: '/es/articulos' },
    '/es/articulos/what-s-inside-a-black-hole-es': { status: 301, destination: '/es/articulos' },
    '/es/articulos/this-shrimp-is-awesome-es': { status: 301, destination: '/es/articulos' },
    '/es/articulos/the-internet-s-own-boy-es': { status: 301, destination: '/es/articulos' },
    '/es/articulos/beautiful-picture-es': { status: 301, destination: '/es/articulos' },
    '/en/articles/a-bug-is-becoming-a-meme-on-the-internet-es': { status: 301, destination: '/en/articles' },
    '/en/articles/what-s-inside-a-black-hole-es': { status: 301, destination: '/en/articles' },
    '/es/products/category/fire-resistant': { status: 301, destination: '/es/productos/categoria/cables-resistentes-al-fuego' },
    '/es/productos/category/cables-libres-de-humo-y-halogenos': { status: 301, destination: '/es/productos/categoria/cables-libres-de-humo-y-halogenos' },
    '/es/productos/flexible-busbar-2000a': { status: 301, destination: '/es/productos' },
    '/es/servicios': { status: 301, destination: '/es/contacto' },
    '/projects/2': { status: 301, destination: '/en/projects/2' },
    '/es/projects/2': { status: 301, destination: '/es/proyectos/2' },
    '/es/projects/4': { status: 301, destination: '/es/proyectos/4' },
    '/es/projects/6': { status: 301, destination: '/es/proyectos/6' },

    '/es/products': { status: 301, destination: '/es/productos' },
    '/es/articles': { status: 301, destination: '/es/articulos' },
    '/es/productos/category': { status: 301, destination: '/es/productos' },
    '/es/solutions': { status: 301, destination: '/es/soluciones' },
    '/es/projects': { status: 301, destination: '/es/proyectos' },
    '/es/contact': { status: 301, destination: '/es/contacto' },
    '/es/about': { status: 301, destination: '/es/acerca-de' },

    '/pt/products': { status: 301, destination: '/pt/produtos' },
    '/pt/solutions': { status: 301, destination: '/pt/solucoes' },
    '/pt/projects': { status: 301, destination: '/pt/projetos' },
    '/pt/contact': { status: 301, destination: '/pt/contato' },
    '/pt/about': { status: 301, destination: '/pt/sobre' },
  },

  // Do not prefetch visible navigation targets during the initial mobile load.
  // This keeps the browser focused on the LCP image and first viewport.
  prefetch: false,

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
    },
    server: {
      allowedHosts: ['host.docker.internal'],
      proxy: {
        '/storage': {
          target: 'http://127.0.0.1:18080',
          changeOrigin: true,
        },
      },
    },
  },
});
