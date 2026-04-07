import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');
const isDevServer = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: isDevServer ? '.next-dev' : '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yanghuasti.oss-cn-shenzhen.aliyuncs.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // 不再使用 rewrites 来处理旧西语路径，统一由 middleware 返回 301 永久重定向
};

export default withNextIntl(nextConfig);
