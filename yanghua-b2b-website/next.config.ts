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
    ],
  },
  async redirects() {
    return [
      // Redirect /news to /en/news
      {
        source: '/news',
        destination: '/en/news',
        permanent: true,
      },
      // Redirect /news/:id to /en/news/:id
      {
        source: '/news/:id',
        destination: '/en/news/:id',
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
