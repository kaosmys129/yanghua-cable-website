// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import remarkGfm from 'remark-gfm';
import vercel from '@astrojs/vercel';

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
  adapter: vercel(),
  // 使用 Vercel adapter，以支持 API 端点的混合部署模式


  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, demoteArticleH1],
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