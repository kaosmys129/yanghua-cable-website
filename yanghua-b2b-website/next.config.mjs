import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yanghuasti.oss-cn-shenzhen.aliyuncs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fruitful-presence-02d7be759c.media.strapiapp.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // 不再使用 rewrites 来处理旧西语路径，统一由 middleware 返回 301 永久重定向
};

export default withNextIntl(nextConfig);