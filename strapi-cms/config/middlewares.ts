export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      credentials: true,
      origin: [
        'http://www.yanghuasti.com',
        'https://yanghuasti.oss-cn-shenzhen.aliyuncs.com',
        /\.yanghuasti\.com$/,
        /\.aliyuncs\.com$/,
        // 添加本地开发环境支持
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // 添加Vercel部署域名支持（用于预览功能）
        /\.vercel\.app$/,
        // 添加其他可能的部署域名
        process.env.FRONTEND_URL,
        process.env.PREVIEW_URL
      ].filter(Boolean), // 过滤掉undefined值
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
    }
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
