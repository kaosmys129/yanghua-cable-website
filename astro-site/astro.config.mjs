// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import node from '@astrojs/node';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  site: 'https://www.yhflexiblebusbar.com',
  output: 'static',
  adapter: node({
    mode: 'standalone',
  }),

  integrations: [
    mdx({
      remarkPlugins: [remarkGfm],
    }),
    sitemap(),
    react(),
  ],

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
