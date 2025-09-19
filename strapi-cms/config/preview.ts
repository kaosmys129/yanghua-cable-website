export default {
  // 预览模式配置
  enabled: true,
  
  // 预览URL配置
  previewUrl: {
    // 文章预览URL模板
    article: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/{locale}/articles/{slug}?preview=true`,
    
    // 其他内容类型可以在这里添加
    // page: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/{locale}/pages/{slug}?preview=true`,
  },
  
  // 预览密钥配置
  secret: process.env.PREVIEW_SECRET || 'your-preview-secret-key',
  
  // 允许的预览域名
  allowedOrigins: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    /\.vercel\.app$/,
    /\.yanghuasti\.com$/
  ].filter(Boolean),
  
  // Webhook配置
  webhook: {
    enabled: true,
    url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/revalidate`,
    events: ['entry.create', 'entry.update', 'entry.delete', 'entry.publish', 'entry.unpublish'],
    headers: {
      'Authorization': `Bearer ${process.env.REVALIDATION_TOKEN || 'your-revalidation-token'}`,
      'Content-Type': 'application/json'
    }
  }
};