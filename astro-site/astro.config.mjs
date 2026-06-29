// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://www.yhflexiblebusbar.com',
  output: 'static',
  adapter: node({
    mode: 'standalone',
  }),

  integrations: [mdx(), sitemap(), robotsTxt()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
