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
  async rewrites() {
    return [
      // 西班牙语URL重写规则
      {
        source: '/es/productos/:path*',
        destination: '/es/products/:path*',
      },
      {
        source: '/es/soluciones/:path*',
        destination: '/es/solutions/:path*',
      },
      {
        source: '/es/servicios/:path*',
        destination: '/es/services/:path*',
      },
      {
        source: '/es/proyectos/:path*',
        destination: '/es/projects/:path*',
      },
      {
        source: '/es/contacto',
        destination: '/es/contact',
      },
      {
        source: '/es/acerca-de',
        destination: '/es/about',
      },
      {
        source: '/es/articulos/:path*',
        destination: '/es/articles/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);