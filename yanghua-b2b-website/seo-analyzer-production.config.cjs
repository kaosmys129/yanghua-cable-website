/**
 * 生产环境SEO分析配置
 * 针对 https://www.yhflexiblebusbar.com 的全面SEO检查
 * 
 * 检查项目：
 * 1. 图片alt属性检查
 * 2. 页面标题重复/缺失检测
 * 3. HTML标签W3C标准验证
 * 4. 元标签完整性分析
 * 5. h1-h6标题层级结构检查
 * 6. SEO不友好因素识别
 */

module.exports = {
  // 生产环境网站URL
  site: 'https://www.yhflexiblebusbar.com',
  
  // 要分析的页面路径
  pages: [
    '/',
    '/en',
    '/es',
    '/en/products',
    '/es/productos',
    '/en/solutions',
    '/es/soluciones',
    '/en/about',
    '/es/acerca-de',
    '/en/services',
    '/es/servicios',
    '/en/projects',
    '/es/proyectos',
    '/en/contact',
    '/es/contacto',
    '/en/articles',
    '/es/articulos'
  ],

  // SEO检查规则配置
  rules: {
    // 1. 图片alt属性检查
    'img-alt': {
      enabled: true,
      severity: 'error',
      description: '检查所有图片是否包含alt属性'
    },
    
    // 2. 页面标题检查
    'title-tag': {
      enabled: true,
      severity: 'error',
      minLength: 10,
      maxLength: 60,
      description: '检查页面标题长度和唯一性'
    },
    
    // Meta描述检查
    'meta-description': {
      enabled: true,
      severity: 'error',
      minLength: 120,
      maxLength: 160,
      description: '检查meta description的长度和存在性'
    },
    
    // 3. HTML标签结构验证
    'html-lang': {
      enabled: true,
      severity: 'error',
      description: '检查HTML标签是否包含lang属性'
    },
    
    'meta-charset': {
      enabled: true,
      severity: 'error',
      description: '检查字符编码声明'
    },
    
    'meta-viewport': {
      enabled: true,
      severity: 'warning',
      description: '检查viewport meta标签'
    },
    
    // 4. 元标签完整性检查
    'meta-tags': {
      enabled: true,
      severity: 'warning',
      required: ['viewport', 'charset', 'robots'],
      description: '检查必要的meta标签'
    },
    
    // 5. H1-H6标题层级结构检查
    'h1-tag': {
      enabled: true,
      severity: 'error',
      description: '检查H1标签的存在性和唯一性'
    },
    
    'heading-structure': {
      enabled: true,
      severity: 'warning',
      description: '检查标题标签的层级结构'
    },
    
    // 6. SEO不友好因素检查
    'canonical-link': {
      enabled: true,
      severity: 'warning',
      description: '检查canonical链接'
    },
    
    'robots-txt': {
      enabled: true,
      severity: 'info',
      description: '检查robots.txt文件'
    },
    
    'sitemap': {
      enabled: true,
      severity: 'info',
      description: '检查XML sitemap'
    },
    
    'lang-attribute': {
      enabled: true,
      severity: 'error',
      description: '检查页面语言属性'
    },
    
    'link-text': {
      enabled: true,
      severity: 'warning',
      description: '检查链接文本的描述性'
    },
    
    'internal-links': {
      enabled: true,
      severity: 'info',
      description: '检查内部链接结构'
    },
    
    'page-speed': {
      enabled: true,
      severity: 'warning',
      description: '检查页面加载速度'
    },
    
    'structured-data': {
      enabled: true,
      severity: 'info',
      description: '检查结构化数据'
    },
    
    'social-tags': {
      enabled: true,
      severity: 'info',
      description: '检查Open Graph和Twitter Card标签'
    },
    
    'duplicate-content': {
      enabled: true,
      severity: 'warning',
      description: '检查重复内容'
    }
  },

  // 忽略的URL模式
  ignore: [
    '/api/*',
    '/_next/*',
    '/admin/*',
    '*.pdf',
    '*.jpg',
    '*.png',
    '*.gif',
    '*.svg',
    '*.ico'
  ],

  // 请求配置
  userAgent: 'Mozilla/5.0 (compatible; YanghuaSEOBot/1.0; +https://www.yhflexiblebusbar.com)',
  
  request: {
    timeout: 30000,
    delay: 2000,  // 2秒延迟，避免对服务器造成压力
    retries: 3
  },

  // 并发设置
  concurrency: 2,  // 降低并发数，避免对生产服务器造成压力
  
  // 详细输出
  verbose: true,

  // 自定义检查
  customChecks: {
    // 中文SEO检查
    'chinese-seo-check': function(page, $) {
      const issues = [];
      const title = $('title').text();
      
      // 检查中文标题长度（中文字符计算方式不同）
      const chineseCharCount = (title.match(/[\u4e00-\u9fa5]/g) || []).length;
      if (chineseCharCount > 30) {
        issues.push({
          type: 'chinese-title-too-long',
          message: `中文标题过长: ${chineseCharCount} 个中文字符`,
          severity: 'warning'
        });
      }
      
      // 检查hreflang标签
      const hreflangLinks = $('link[hreflang]');
      if (hreflangLinks.length === 0) {
        issues.push({
          type: 'missing-hreflang',
          message: '多语言网站缺少hreflang标签',
          severity: 'warning'
        });
      }
      
      return issues;
    },

    // B2B网站特定检查
    'b2b-seo-check': function(page, $) {
      const issues = [];
      const content = $('body').text().toLowerCase();
      
      // 检查联系信息
      const hasPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(content);
      const hasEmail = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content);
      
      if (!hasPhone && !hasEmail) {
        issues.push({
          type: 'missing-contact-info',
          message: '页面缺少明显的联系信息（电话或邮箱）',
          severity: 'warning'
        });
      }
      
      // 检查B2B相关关键词
      const b2bKeywords = ['wholesale', 'manufacturer', 'supplier', 'factory', 'oem', 'odm', 'bulk', 'industrial'];
      const hasB2BKeywords = b2bKeywords.some(keyword => content.includes(keyword));
      
      if (!hasB2BKeywords) {
        issues.push({
          type: 'missing-b2b-keywords',
          message: '建议在内容中包含B2B相关关键词',
          severity: 'info'
        });
      }
      
      // 检查产品规格信息
      const hasSpecs = /specification|parameter|dimension|capacity|voltage|current|ampere/.test(content);
      if (!hasSpecs && page.url.includes('/product')) {
        issues.push({
          type: 'missing-product-specs',
          message: '产品页面建议包含详细规格参数',
          severity: 'info'
        });
      }
      
      return issues;
    },

    // 技术SEO检查
    'technical-seo-check': function(page, $) {
      const issues = [];
      
      // 检查页面加载时间
      if (page.loadTime && page.loadTime > 3000) {
        issues.push({
          type: 'slow-page-load',
          message: `页面加载时间过长: ${page.loadTime}ms`,
          severity: 'warning'
        });
      }
      
      // 检查图片优化
      const images = $('img');
      let unoptimizedImages = 0;
      
      images.each(function() {
        const src = $(this).attr('src');
        const width = $(this).attr('width');
        const height = $(this).attr('height');
        const loading = $(this).attr('loading');
        
        // 检查是否有尺寸属性
        if (!width || !height) {
          unoptimizedImages++;
        }
        
        // 检查是否使用了懒加载
        if (!loading && !src.includes('data:image')) {
          unoptimizedImages++;
        }
      });
      
      if (unoptimizedImages > 0) {
        issues.push({
          type: 'unoptimized-images',
          message: `发现 ${unoptimizedImages} 个未优化的图片`,
          severity: 'info'
        });
      }
      
      // 检查外部链接
      const externalLinks = $('a[href^="http"]:not([href*="yhflexiblebusbar.com"])');
      let noFollowCount = 0;
      
      externalLinks.each(function() {
        const rel = $(this).attr('rel');
        if (!rel || !rel.includes('nofollow')) {
          noFollowCount++;
        }
      });
      
      if (noFollowCount > 0) {
        issues.push({
          type: 'external-links-without-nofollow',
          message: `建议为 ${noFollowCount} 个外部链接添加 rel="nofollow"`,
          severity: 'info'
        });
      }
      
      return issues;
    }
  },

  // 输出配置
  output: {
    format: ['json', 'html'],
    path: './seo-reports/',
    filename: `production-seo-analysis-${new Date().toISOString().replace(/[:.]/g, '-')}`
  }
};