import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig = {
  // 静态导出配置 - 临时禁用用于测试
  // output: 'export',
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // 启用实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // 性能优化配置
  compiler: {
    // 移除 console.log (生产环境)
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 图片优化配置
  images: {
    // 启用图片优化
    formats: ['image/webp', 'image/avif'],
    // 图片尺寸
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 远程图片模式
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
      },
      {
        protocol: 'https',
        hostname: 'fruitful-presence-02d7be759c.strapiapp.com',
      }
    ],
    // 启用危险的允许 SVG
    dangerouslyAllowSVG: true,
    // SVG 内容安全策略
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 启用压缩
  compress: true,
  // 启用 SWC 压缩
  swcMinify: true,
  // 页面扩展名
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // 重定向配置
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
