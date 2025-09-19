export default () => ({
  // 配置预览功能
  'preview-button': {
    enabled: true,
    config: {
      contentTypes: [
        {
          uid: 'api::article.article',
          draft: {
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/{locale}/articles/{slug}?preview=true`,
            query: {
              type: 'article',
              slug: 'slug'
            }
          },
          published: {
            url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/{locale}/articles/{slug}`,
            query: {
              type: 'article', 
              slug: 'slug'
            }
          }
        }
      ]
    }
  }
});