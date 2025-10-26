const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');

// ==================== 配置 ====================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';
const LANGUAGES = ['en', 'es'];
const BUILD_DIR = '.next';
const PUBLIC_DIR = 'public';

// 检测报告
const diagnosticReport = {
  timestamp: new Date().toISOString(),
  site: SITE_URL,
  languages: LANGUAGES,
  checks: {
    robotsTxt: { status: 'pending', issues: [], warnings: [], suggestions: [] },
    sitemap: { status: 'pending', issues: [], warnings: [], suggestions: [] },
    metadata: { status: 'pending', issues: [], warnings: [], suggestions: [] },
    hreflang: { status: 'pending', issues: [], warnings: [], suggestions: [] },
    structuredData: { status: 'pending', issues: [], warnings: [], suggestions: [] },
  },
  summary: { critical: 0, warnings: 0, suggestions: 0 }
};

// ==================== 检测函数 ====================

/**
 * 检测 robots.txt
 */
async function checkRobotsTxt() {
  console.log('\n🔍 [1/5] 检测 robots.txt...');
  const check = diagnosticReport.checks.robotsTxt;
  
  try {
    // 方法1: 检查 public/robots.txt
    const publicRobotsPath = path.join(PUBLIC_DIR, 'robots.txt');
    
    // 方法2: 检查 src/app/robots.ts
    const appRobotsPath = 'src/app/robots.ts';
    
    let robotsContent = null;
    let source = null;
    
    if (fs.existsSync(publicRobotsPath)) {
      robotsContent = fs.readFileSync(publicRobotsPath, 'utf-8');
      source = 'public/robots.txt';
    } else if (fs.existsSync(appRobotsPath)) {
      console.log('  ℹ️  检测到动态 robots.ts 文件');
      source = 'src/app/robots.ts';
      // 动态robots需要构建后才能验证
      check.warnings.push('使用动态robots.ts，需要运行构建来验证输出');
    }
    
    if (!robotsContent && !fs.existsSync(appRobotsPath)) {
      check.status = 'fail';
      check.issues.push('❌ 未找到 robots.txt 或 robots.ts');
      check.suggestions.push('创建 public/robots.txt 或 src/app/robots.ts');
      return;
    }
    
    if (robotsContent) {
      console.log(`  ✓ 找到 ${source}`);
      
      // 检查关键配置
      const checks = [
        {
          pattern: /User-agent:\s*\*/i,
          name: 'User-agent声明',
          critical: true
        },
        {
          pattern: /Allow:\s*\//i,
          name: 'Allow规则',
          critical: true
        },
        {
          pattern: /Disallow:\s*\/$/m,
          name: '阻止所有路径 (Disallow: /)',
          critical: true,
          shouldNotExist: true
        },
        {
          pattern: /Sitemap:/i,
          name: 'Sitemap声明',
          critical: false
        },
      ];
      
      checks.forEach(({ pattern, name, critical, shouldNotExist }) => {
        const found = pattern.test(robotsContent);
        
        if (shouldNotExist) {
          if (found) {
            check.issues.push(`❌ 检测到 ${name} - 这会阻止所有搜索引擎！`);
            check.status = 'fail';
          } else {
            console.log(`  ✓ 未发现阻止性规则`);
          }
        } else {
          if (found) {
            console.log(`  ✓ ${name} 存在`);
          } else {
            if (critical) {
              check.issues.push(`❌ 缺少 ${name}`);
            } else {
              check.warnings.push(`⚠️  建议添加 ${name}`);
            }
          }
        }
      });
      
      // 检查sitemap URL
      const sitemapMatches = robotsContent.match(/Sitemap:\s*(.+)/gi);
      if (sitemapMatches) {
        sitemapMatches.forEach(match => {
          const url = match.split(':')[1].trim();
          console.log(`  ℹ️  Sitemap URL: ${url}`);
          
          // 检查URL格式
          if (!url.startsWith('http')) {
            check.warnings.push(`⚠️  Sitemap URL应使用完整URL: ${url}`);
          }
        });
      }
      
      // 检查多语言sitemap
      LANGUAGES.forEach(lang => {
        if (!robotsContent.includes(`sitemap-${lang}.xml`)) {
          check.suggestions.push(`💡 建议添加语言特定的sitemap: sitemap-${lang}.xml`);
        }
      });
      
      if (check.issues.length === 0) {
        check.status = 'pass';
      }
    }
    
  } catch (error) {
    check.status = 'error';
    check.issues.push(`❌ 检测出错: ${error.message}`);
  }
}

/**
 * 检测 Sitemap
 */
async function checkSitemap() {
  console.log('\n🔍 [2/5] 检测 Sitemap...');
  const check = diagnosticReport.checks.sitemap;
  
  try {
    // 检查静态sitemap文件
    const staticSitemaps = [
      'public/sitemap.xml',
      'public/sitemap-en.xml',
      'public/sitemap-es.xml'
    ];
    
    // 检查动态sitemap
    const dynamicSitemap = 'src/app/sitemap.ts';
    
    let foundStatic = false;
    let foundDynamic = false;
    
    // 检查静态sitemap
    staticSitemaps.forEach(sitemapPath => {
      if (fs.existsSync(sitemapPath)) {
        console.log(`  ✓ 找到 ${sitemapPath}`);
        foundStatic = true;
        
        // 验证XML格式
        const content = fs.readFileSync(sitemapPath, 'utf-8');
        
        if (!content.includes('<?xml')) {
          check.issues.push(`❌ ${sitemapPath} 不是有效的XML文件`);
        }
        
        if (!content.includes('<urlset')) {
          check.issues.push(`❌ ${sitemapPath} 缺少 <urlset> 标签`);
        }
        
        // 检查URL数量
        const urlCount = (content.match(/<loc>/g) || []).length;
        console.log(`  ℹ️  包含 ${urlCount} 个URL`);
        
        if (urlCount === 0) {
          check.issues.push(`❌ ${sitemapPath} 不包含任何URL`);
        }
        
        // 检查URL格式
        const urls = content.match(/<loc>([^<]+)<\/loc>/g) || [];
        urls.slice(0, 5).forEach(urlTag => {
          const url = urlTag.replace(/<\/?loc>/g, '');
          if (!url.startsWith('http')) {
            check.issues.push(`❌ URL格式错误: ${url}`);
          }
        });
        
        // 检查lastmod
        if (!content.includes('<lastmod>')) {
          check.suggestions.push(`💡 建议在 ${sitemapPath} 中添加 <lastmod> 标签`);
        }
        
        // 检查hreflang
        if (!content.includes('hreflang') && sitemapPath.includes('sitemap.xml')) {
          check.suggestions.push(`💡 主sitemap建议包含 hreflang 链接`);
        }
      }
    });
    
    // 检查动态sitemap
    if (fs.existsSync(dynamicSitemap)) {
      console.log(`  ✓ 找到动态 ${dynamicSitemap}`);
      foundDynamic = true;
      
      const content = fs.readFileSync(dynamicSitemap, 'utf-8');
      
      // 检查基本结构
      if (!content.includes('export default')) {
        check.issues.push(`❌ ${dynamicSitemap} 缺少 default export`);
      }
      
      // 检查返回类型
      if (!content.includes('MetadataRoute.Sitemap') && !content.includes('Promise<')) {
        check.warnings.push(`⚠️  ${dynamicSitemap} 可能缺少正确的返回类型`);
      }
      
      check.warnings.push('⚠️  使用动态sitemap，需要构建后验证输出');
    }
    
    // 总结
    if (!foundStatic && !foundDynamic) {
      check.status = 'fail';
      check.issues.push('❌ 未找到任何sitemap文件');
      check.suggestions.push('创建 src/app/sitemap.ts 或 public/sitemap.xml');
    } else {
      if (check.issues.length === 0) {
        check.status = 'pass';
      } else {
        check.status = 'fail';
      }
    }
    
  } catch (error) {
    check.status = 'error';
    check.issues.push(`❌ 检测出错: ${error.message}`);
  }
}

/**
 * 检测在线页面metadata
 */
async function checkOnlineMetadata(url) {
  const issues = [];
  const warnings = [];
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Checker/1.0)'
      }
    });
    
    if (!response.ok) {
      issues.push(`❌ 页面不可访问: HTTP ${response.status}`);
      return { issues, warnings };
    }
    
    const html = await response.text();
    const root = parse(html);
    
    // 检查title
    const title = root.querySelector('title');
    if (!title) {
      issues.push('❌ 缺少 <title> 标签');
    } else {
      const titleText = title.text;
      if (titleText.length < 10) {
        warnings.push('⚠️  title太短 (建议10-60字符)');
      }
      if (titleText.length > 60) {
        warnings.push('⚠️  title太长 (建议10-60字符)');
      }
    }
    
    // 检查description
    const description = root.querySelector('meta[name="description"]');
    if (!description) {
      issues.push('❌ 缺少 meta description');
    } else {
      const descText = description.getAttribute('content') || '';
      if (descText.length < 120) {
        warnings.push('⚠️  description太短 (建议120-160字符)');
      }
      if (descText.length > 160) {
        warnings.push('⚠️  description太长 (建议120-160字符)');
      }
    }
    
    // 检查robots meta
    const robotsMeta = root.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      const content = robotsMeta.getAttribute('content') || '';
      if (content.includes('noindex')) {
        issues.push('❌ 检测到 noindex - 页面不会被索引！');
      }
      if (content.includes('nofollow')) {
        warnings.push('⚠️  检测到 nofollow - 链接不会被跟踪');
      }
    }
    
    // 检查viewport
    const viewport = root.querySelector('meta[name="viewport"]');
    if (!viewport) {
      issues.push('❌ 缺少 viewport meta (移动端不友好)');
    }
    
    // 检查OpenGraph
    const ogTags = ['og:title', 'og:description', 'og:image', 'og:url'];
    ogTags.forEach(tag => {
      const ogTag = root.querySelector(`meta[property="${tag}"]`);
      if (!ogTag) {
        warnings.push(`⚠️  缺少 ${tag}`);
      }
    });
    
    return { issues, warnings };
    
  } catch (error) {
    issues.push(`❌ 检测失败: ${error.message}`);
    return { issues, warnings };
  }
}

/**
 * 检测 Metadata 配置
 */
async function checkMetadata() {
  console.log('\n🔍 [3/5] 检测 Metadata 配置...');
  const check = diagnosticReport.checks.metadata;
  
  try {
    // 检查metadata配置文件
    const metadataFiles = [
      'src/app/[locale]/layout.tsx',
      'src/app/layout.tsx',
      'src/lib/metadata.ts',
      'src/lib/metadata-config.ts'
    ];
    
    let foundMetadataFile = false;
    
    for (const filePath of metadataFiles) {
      if (fs.existsSync(filePath)) {
        console.log(`  ✓ 找到 ${filePath}`);
        foundMetadataFile = true;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // 检查关键配置
        const checks = [
          { pattern: /generateMetadata/i, name: 'generateMetadata函数' },
          { pattern: /(metadata.*=|generateMetadata)/i, name: 'metadata导出' },
          { pattern: /title/i, name: 'title配置' },
          { pattern: /description/i, name: 'description配置' },
          { pattern: /openGraph/i, name: 'OpenGraph配置' },
          { pattern: /robots/i, name: 'robots配置' },
          { pattern: /alternates/i, name: 'alternates配置 (canonical)' },
        ];
        
        checks.forEach(({ pattern, name }) => {
          if (pattern.test(content)) {
            console.log(`    ✓ ${name} 存在`);
          } else {
            check.warnings.push(`⚠️  ${filePath} 中未找到 ${name}`);
          }
        });
        
        // 检查noindex配置
        if (/noindex/i.test(content)) {
          check.issues.push(`❌ ${filePath} 中检测到 noindex 配置`);
        }
        
        break; // 找到第一个就停止
      }
    }
    
    if (!foundMetadataFile) {
      check.warnings.push('⚠️  未找到明确的metadata配置文件');
    }
    
    // 检查在线页面metadata
    console.log('\n  检测在线页面metadata...');
    const testPages = [
      { lang: 'en', path: '' },
      { lang: 'es', path: '' },
      { lang: 'en', path: '/products' },
      { lang: 'es', path: '/productos' },
    ];
    
    for (const page of testPages) {
      const url = `${SITE_URL}/${page.lang}${page.path}`;
      console.log(`  检查: ${url}`);
      
      const result = await checkOnlineMetadata(url);
      check.issues.push(...result.issues);
      check.warnings.push(...result.warnings);
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    check.status = check.issues.length === 0 ? 'pass' : 'fail';
    
  } catch (error) {
    check.status = 'error';
    check.issues.push(`❌ 检测出错: ${error.message}`);
  }
}

/**
 * 检测 Hreflang 配置
 */
async function checkHreflang() {
  console.log('\n🔍 [4/5] 检测 Hreflang 配置...');
  const check = diagnosticReport.checks.hreflang;
  
  try {
    // 检查代码中的hreflang配置
    const hreflangFiles = [
      'src/lib/seo.ts',
      'src/lib/metadata.ts',
      'src/app/[locale]/layout.tsx'
    ];
    
    let foundHreflangConfig = false;
    
    for (const filePath of hreflangFiles) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (/hreflang|alternates.*languages/i.test(content)) {
          console.log(`  ✓ 在 ${filePath} 中找到 hreflang 配置`);
          foundHreflangConfig = true;
          
          // 检查语言配置
          LANGUAGES.forEach(lang => {
            if (!content.includes(`'${lang}'`) && !content.includes(`"${lang}"`)) {
              check.warnings.push(`⚠️  ${filePath} 中可能缺少 ${lang} 语言配置`);
            }
          });
          
          break;
        }
      }
    }
    
    if (!foundHreflangConfig) {
      check.warnings.push('⚠️  未找到明确的 hreflang 配置');
    }
    
    check.status = check.issues.length === 0 ? 'pass' : 'fail';
    
  } catch (error) {
    check.status = 'error';
    check.issues.push(`❌ 检测出错: ${error.message}`);
  }
}

/**
 * 检测结构化数据
 */
async function checkStructuredData() {
  console.log('\n🔍 [5/5] 检测结构化数据...');
  const check = diagnosticReport.checks.structuredData;
  
  try {
    // 检查结构化数据配置文件
    const structuredDataFiles = [
      'src/lib/structured-data.ts',
      'src/lib/schema.ts',
      'src/components/StructuredData.tsx'
    ];
    
    let foundStructuredData = false;
    
    for (const filePath of structuredDataFiles) {
      if (fs.existsSync(filePath)) {
        console.log(`  ✓ 找到 ${filePath}`);
        foundStructuredData = true;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // 检查常见的结构化数据类型
        const schemaTypes = [
          'Organization',
          'WebSite',
          'Product',
          'Article',
          'BreadcrumbList'
        ];
        
        schemaTypes.forEach(type => {
          if (content.includes(type)) {
            console.log(`    ✓ 找到 ${type} schema`);
          } else {
            check.suggestions.push(`💡 建议添加 ${type} 结构化数据`);
          }
        });
        
        break;
      }
    }
    
    if (!foundStructuredData) {
      check.warnings.push('⚠️  未找到结构化数据配置');
      check.suggestions.push('💡 建议添加结构化数据以提升SEO效果');
    }
    
    check.status = check.issues.length === 0 ? 'pass' : 'fail';
    
  } catch (error) {
    check.status = 'error';
    check.issues.push(`❌ 检测出错: ${error.message}`);
  }
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('\n📊 生成检测报告...');
  
  // 统计问题数量
  Object.values(diagnosticReport.checks).forEach(check => {
    diagnosticReport.summary.critical += check.issues.length;
    diagnosticReport.summary.warnings += check.warnings.length;
    diagnosticReport.summary.suggestions += check.suggestions.length;
  });
  
  // 输出报告
  console.log('\n' + '='.repeat(60));
  console.log('🔍 SEO 检测报告');
  console.log('='.repeat(60));
  console.log(`📅 检测时间: ${diagnosticReport.timestamp}`);
  console.log(`🌐 网站: ${diagnosticReport.site}`);
  console.log(`🗣️  语言: ${diagnosticReport.languages.join(', ')}`);
  console.log('');
  
  // 总结
  console.log('📈 检测总结:');
  console.log(`  ❌ 严重问题: ${diagnosticReport.summary.critical}`);
  console.log(`  ⚠️  警告: ${diagnosticReport.summary.warnings}`);
  console.log(`  💡 建议: ${diagnosticReport.summary.suggestions}`);
  console.log('');
  
  // 详细结果
  Object.entries(diagnosticReport.checks).forEach(([name, check]) => {
    const statusIcon = check.status === 'pass' ? '✅' : 
                      check.status === 'fail' ? '❌' : 
                      check.status === 'error' ? '💥' : '⏳';
    
    console.log(`${statusIcon} ${name.toUpperCase()}: ${check.status}`);
    
    if (check.issues.length > 0) {
      console.log('  严重问题:');
      check.issues.forEach(issue => console.log(`    ${issue}`));
    }
    
    if (check.warnings.length > 0) {
      console.log('  警告:');
      check.warnings.forEach(warning => console.log(`    ${warning}`));
    }
    
    if (check.suggestions.length > 0) {
      console.log('  建议:');
      check.suggestions.forEach(suggestion => console.log(`    ${suggestion}`));
    }
    
    console.log('');
  });
  
  // 保存报告到文件
  const reportPath = 'seo-diagnosis-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(diagnosticReport, null, 2));
  console.log(`📄 详细报告已保存到: ${reportPath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始 SEO 配置检测...');
  console.log(`📍 工作目录: ${process.cwd()}`);
  console.log(`🌐 目标网站: ${SITE_URL}`);
  console.log(`🗣️  支持语言: ${LANGUAGES.join(', ')}`);
  
  try {
    await checkRobotsTxt();
    await checkSitemap();
    await checkMetadata();
    await checkHreflang();
    await checkStructuredData();
    
    generateReport();
    
    console.log('\n✅ SEO 检测完成！');
    
    // 返回退出码
    const hasErrors = Object.values(diagnosticReport.checks).some(check => 
      check.status === 'fail' || check.status === 'error'
    );
    
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('\n💥 检测过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main };
