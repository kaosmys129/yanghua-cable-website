/**
 * SEO Analyzer 配置文件
 * 用于全面的SEO基础检查，包括图片alt属性、标题重复、HTML标准等
 */

module.exports = {
  // 基本配置
  site: 'http://localhost:3000',
  
  // 输出配置
  output: {
    format: 'json',
    file: 'seo-analyzer-report.json',
    console: true
  },

  // 检查规则配置
  rules: {
    // 图片alt属性检查
    'img-alt': {
      enabled: true,
      severity: 'error',
      description: '检查所有图片标签是否包含alt属性'
    },
    
    // 页面标题检查
    'title-tag': {
      enabled: true,
      severity: 'error',
      minLength: 10,
      maxLength: 60,
      description: '检查页面标题是否存在且长度合适'
    },
    
    // 元描述检查
    'meta-description': {
      enabled: true,
      severity: 'error',
      minLength: 120,
      maxLength: 160,
      description: '检查元描述标签的存在和长度'
    },
    
    // H1标签检查
    'h1-tag': {
      enabled: true,
      severity: 'error',
      unique: true,
      description: '检查H1标签是否存在且唯一'
    },
    
    // 标题层级结构检查
    'heading-structure': {
      enabled: true,
      severity: 'warning',
      description: '检查h1-h6标题标签的层级结构是否合理'
    },
    
    // 元标签检查
    'meta-tags': {
      enabled: true,
      severity: 'warning',
      required: ['viewport', 'charset', 'robots'],
      description: '检查必要的元标签是否存在'
    },
    
    // 语言属性检查
    'lang-attribute': {
      enabled: true,
      severity: 'error',
      description: '检查HTML标签是否包含lang属性'
    },
    
    // 链接检查
    'link-text': {
      enabled: true,
      severity: 'warning',
      description: '检查链接文本是否有意义'
    },
    
    // 内部链接检查
    'internal-links': {
      enabled: true,
      severity: 'info',
      description: '分析内部链接结构'
    },
    
    // 页面加载速度相关
    'page-speed': {
      enabled: true,
      severity: 'warning',
      description: '检查影响页面加载速度的因素'
    },
    
    // 结构化数据检查
    'structured-data': {
      enabled: true,
      severity: 'info',
      description: '检查结构化数据的存在'
    },
    
    // 社交媒体标签检查
    'social-tags': {
      enabled: true,
      severity: 'info',
      description: '检查Open Graph和Twitter Card标签'
    },
    
    // 重复内容检查
    'duplicate-content': {
      enabled: true,
      severity: 'warning',
      description: '检查页面中的重复内容'
    }
  },

  // 忽略的URL模式
  ignore: [
    '/api/*',
    '/admin/*',
    '/_next/*',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ],

  // 用户代理设置
  userAgent: 'SEO-Analyzer/3.2.0 (Yanghua B2B Website)',

  // 请求配置
  request: {
    timeout: 30000,
    delay: 1000, // 请求间隔，避免对服务器造成压力
    retries: 3
  },

  // 并发控制
  concurrency: 2, // 限制并发请求数量

  // 详细输出
  verbose: true,

  // 自定义检查函数
  customChecks: [
    {
      name: 'chinese-seo-check',
      description: '中文SEO特殊检查',
      check: function($, url) {
        const issues = [];
        
        // 检查中文标题长度（中文字符计算）
        const title = $('title').text();
        if (title) {
          const chineseChars = title.match(/[\u4e00-\u9fa5]/g);
          if (chineseChars && chineseChars.length > 30) {
            issues.push({
              type: 'warning',
              message: '中文标题过长，建议控制在30个汉字以内',
              element: 'title'
            });
          }
        }
        
        // 检查是否有hreflang标签（多语言网站）
        const hreflangLinks = $('link[hreflang]');
        if (hreflangLinks.length === 0) {
          issues.push({
            type: 'info',
            message: '建议添加hreflang标签以支持多语言SEO',
            element: 'head'
          });
        }
        
        return issues;
      }
    },
    
    {
      name: 'b2b-seo-check',
      description: 'B2B网站特殊SEO检查',
      check: function($, url) {
        const issues = [];
        
        // 检查是否有联系信息
        const contactInfo = $('*:contains("contact"), *:contains("联系"), *:contains("电话"), *:contains("邮箱")');
        if (contactInfo.length === 0) {
          issues.push({
            type: 'warning',
            message: 'B2B网站建议在页面中包含明显的联系信息',
            element: 'body'
          });
        }
        
        // 检查是否有产品/服务相关关键词
        const content = $('body').text().toLowerCase();
        const b2bKeywords = ['product', 'service', '产品', '服务', 'solution', '解决方案'];
        const hasB2BKeywords = b2bKeywords.some(keyword => content.includes(keyword));
        
        if (!hasB2BKeywords) {
          issues.push({
            type: 'info',
            message: '建议在页面内容中包含产品或服务相关关键词',
            element: 'body'
          });
        }
        
        return issues;
      }
    }
  ]
};