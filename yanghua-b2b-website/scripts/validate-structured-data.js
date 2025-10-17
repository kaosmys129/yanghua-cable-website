/**
 * 结构化数据验证脚本
 * 用于验证网站中的 JSON-LD 结构化数据是否符合 Schema.org 规范
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 验证配置
const VALIDATION_CONFIG = {
  baseUrl: 'http://localhost:3000',
  pages: [
    { path: '/en', name: 'Homepage (EN)' },
    { path: '/es', name: 'Homepage (ES)' },
    { path: '/en/products/flexible-busbar-2000a', name: 'Product Detail (EN)' },
    { path: '/es/productos/flexible-busbar-2000a', name: 'Product Detail (ES)' },
    { path: '/en/projects/1', name: 'Project Detail (EN)' },
    { path: '/es/proyectos/1', name: 'Project Detail (ES)' }
  ],
  outputFile: 'structured-data-validation-report.json'
};

// Schema.org 类型验证规则
const SCHEMA_VALIDATION_RULES = {
  Organization: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['logo', 'description', 'address', 'contactPoint']
  },
  WebSite: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['description', 'potentialAction']
  },
  Product: {
    required: ['@context', '@type', 'name', 'description'],
    recommended: ['image', 'brand', 'offers', 'manufacturer']
  },
  Article: {
    required: ['@context', '@type', 'headline', 'author', 'publisher'],
    recommended: ['image', 'datePublished', 'dateModified']
  },
  BreadcrumbList: {
    required: ['@context', '@type', 'itemListElement'],
    recommended: []
  }
};

/**
 * 验证单个 Schema 对象
 */
function validateSchema(schema, type) {
  const rules = SCHEMA_VALIDATION_RULES[type];
  if (!rules) {
    return {
      isValid: false,
      errors: [`Unknown schema type: ${type}`],
      warnings: []
    };
  }

  const errors = [];
  const warnings = [];

  // 检查必需字段
  rules.required.forEach(field => {
    if (!schema[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // 检查推荐字段
  rules.recommended.forEach(field => {
    if (!schema[field]) {
      warnings.push(`Missing recommended field: ${field}`);
    }
  });

  // 验证 @context
  if (schema['@context'] && schema['@context'] !== 'https://schema.org') {
    warnings.push('@context should be "https://schema.org"');
  }

  // 验证 URL 格式
  ['url', 'image', 'logo'].forEach(field => {
    if (schema[field]) {
      const url = typeof schema[field] === 'object' ? schema[field].url : schema[field];
      if (url && !url.startsWith('http')) {
        errors.push(`Invalid URL format for ${field}: ${url}`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 从页面提取结构化数据
 */
async function extractStructuredData(page) {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const data = [];
    
    scripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent);
        data.push(json);
      } catch (error) {
        console.error('Failed to parse JSON-LD:', error);
      }
    });
    
    return data;
  });
}

/**
 * 验证单个页面
 */
async function validatePage(browser, pageConfig) {
  const page = await browser.newPage();
  const url = `${VALIDATION_CONFIG.baseUrl}${pageConfig.path}`;
  
  console.log(`Validating: ${pageConfig.name} (${url})`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    const structuredData = await extractStructuredData(page);
    
    const results = {
      page: pageConfig.name,
      url: url,
      schemasFound: structuredData.length,
      schemas: [],
      overallValid: true
    };
    
    structuredData.forEach((schema, index) => {
      const schemaType = schema['@type'];
      const validation = validateSchema(schema, schemaType);
      
      results.schemas.push({
        index: index + 1,
        type: schemaType,
        validation: validation,
        schema: schema
      });
      
      if (!validation.isValid) {
        results.overallValid = false;
      }
    });
    
    return results;
    
  } catch (error) {
    return {
      page: pageConfig.name,
      url: url,
      error: error.message,
      overallValid: false
    };
  } finally {
    await page.close();
  }
}

/**
 * 主验证函数
 */
async function validateAllPages() {
  console.log('🔍 Starting structured data validation...\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const results = [];
  
  try {
    for (const pageConfig of VALIDATION_CONFIG.pages) {
      const result = await validatePage(browser, pageConfig);
      results.push(result);
    }
    
    // 生成报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: results.length,
        validPages: results.filter(r => r.overallValid).length,
        invalidPages: results.filter(r => !r.overallValid).length,
        totalSchemas: results.reduce((sum, r) => sum + (r.schemasFound || 0), 0)
      },
      results: results
    };
    
    // 保存报告
    const reportPath = path.join(__dirname, '..', VALIDATION_CONFIG.outputFile);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 输出摘要
    console.log('\n📊 Validation Summary:');
    console.log(`✅ Valid pages: ${report.summary.validPages}/${report.summary.totalPages}`);
    console.log(`❌ Invalid pages: ${report.summary.invalidPages}/${report.summary.totalPages}`);
    console.log(`📄 Total schemas found: ${report.summary.totalSchemas}`);
    console.log(`📁 Report saved to: ${reportPath}\n`);
    
    // 输出详细结果
    results.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.page}: ERROR - ${result.error}`);
      } else if (result.overallValid) {
        console.log(`✅ ${result.page}: ${result.schemasFound} schemas found, all valid`);
      } else {
        console.log(`⚠️  ${result.page}: ${result.schemasFound} schemas found, validation issues detected`);
        result.schemas.forEach(schema => {
          if (!schema.validation.isValid) {
            console.log(`   - ${schema.type}: ${schema.validation.errors.join(', ')}`);
          }
        });
      }
    });
    
    return report.summary.invalidPages === 0;
    
  } finally {
    await browser.close();
  }
}

/**
 * Google 结构化数据测试工具 URL 生成器
 */
function generateTestUrls(results) {
  console.log('\n🔗 Google Structured Data Testing Tool URLs:');
  results.forEach(result => {
    if (!result.error && result.schemasFound > 0) {
      const encodedUrl = encodeURIComponent(result.url);
      const testUrl = `https://search.google.com/test/rich-results?url=${encodedUrl}`;
      console.log(`${result.page}: ${testUrl}`);
    }
  });
}

// 运行验证
if (require.main === module) {
  validateAllPages()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  validateAllPages,
  validateSchema,
  extractStructuredData
};