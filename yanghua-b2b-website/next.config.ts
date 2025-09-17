import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yanghuasti.oss-cn-shenzhen.aliyuncs.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      // Allow Strapi Cloud media assets
      {
        protocol: 'https',
        hostname: '**.media.strapiapp.com',
      }
    ],
  },
  async redirects() {
    return [
      // Redirect /news to /en/articles
      {
        source: '/news',
        destination: '/en/articles',
        permanent: true,
      },
      // Redirect /news/:id to /en/articles/:id
      {
        source: '/news/:id',
        destination: '/en/articles/:id',
        permanent: true,
      },
      // --- Add locale-specific redirects for news ---
      {
        source: '/en/news',
        destination: '/en/articles',
        permanent: true,
      },
      {
        source: '/es/news',
        destination: '/es/articles',
        permanent: true,
      },
      {
        source: '/en/news/:id',
        destination: '/en/articles/:id',
        permanent: true,
      },
      {
        source: '/es/news/:id',
        destination: '/es/articles/:id',
        permanent: true,
      },
      // -----------------------------------------

      // Redirect /blogs to /en/articles
      {
        source: '/blogs',
        destination: '/en/articles',
        permanent: true,
      },
      // Redirect /blogs/:id to /en/articles/:id
      {
        source: '/blogs/:id',
        destination: '/en/articles/:id',
        permanent: true,
      },
      // Redirect /en/blogs to /en/articles
      {
        source: '/en/blogs',
        destination: '/en/articles',
        permanent: true,
      },
      // Redirect /en/blogs/:id to /en/articles/:id
      {
        source: '/en/blogs/:id',
        destination: '/en/articles/:id',
        permanent: true,
      },
      // Redirect /es/blogs to /es/articles
      {
        source: '/es/blogs',
        destination: '/es/articles',
        permanent: true,
      },
      // Redirect /es/blogs/:id to /es/articles/:id
      {
        source: '/es/blogs/:id',
        destination: '/es/articles/:id',
        permanent: true,
      },
      // Redirect /projects to /en/projects
      {
        source: '/projects',
        destination: '/en/projects',
        permanent: true,
      },
      // Redirect /projects/:id to /en/projects/:id
      {
        source: '/projects/:id',
        destination: '/en/projects/:id',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
