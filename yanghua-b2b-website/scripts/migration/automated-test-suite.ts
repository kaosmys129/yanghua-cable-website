#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { performance } from 'perf_hooks';

// 测试配置接口
interface TestConfig {
  wordpress: {
    url: string;
    username: string;
    password: string;
  };
  strapi?: {
    url: string;
    token: string;
  };
  tests: {
    functional: boolean;
    performance: boolean;
    seo: boolean;
    accessibility: boolean;
    security: boolean;
  };
  thresholds: {
    responseTime: number; // ms
    pageLoadTime: number; // ms
    seoScore: number;
    accessibilityScore: number;
  };
}

// 测试结果接口
interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  duration: number;
  details: string;
  score?: number;
  threshold?: number;
  error?: string;
}

// 测试套件报告
interface TestSuiteReport {
  startTime: Date;
  endTime?: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  overallScore: number;
  testResults: TestResult[];
  recommendations: string[];
  summary: {
    functional: TestResult[];
    performance: TestResult[];
    seo: TestResult[];
    accessibility: TestResult[];
    security: TestResult[];
  };
}

// 性能指标
interface PerformanceMetrics {
  responseTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

class AutomatedTestSuite {
  private config: TestConfig;
  private report: TestSuiteReport;
  private logFile: string;

  constructor(config: TestConfig) {
    this.config = config;
    this.report = {
      startTime: new Date(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
      overallScore: 0,
      testResults: [],
      recommendations: [],
      summary: {
        functional: [],
        performance: [],
        seo: [],
        accessibility: [],
        security: []
      }
    };
    this.logFile = path.join(process.cwd(), `test-suite-${Date.now()}.log`);
  }

  private async log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    console.log(logMessage);
    await fs.appendFile(this.logFile, logMessage + '\n');
  }

  // 执行单个测试
  private async executeTest(
    testName: string, 
    testFunction: () => Promise<TestResult>,
    category: keyof TestSuiteReport['summary']
  ): Promise<TestResult> {
    await this.log(`执行测试: ${testName}`);
    const startTime = performance.now();
    
    try {
      const result = await testFunction();
      result.duration = performance.now() - startTime;
      
      this.report.testResults.push(result);
      this.report.summary[category].push(result);
      
      switch (result.status) {
        case 'pass':
          this.report.passedTests++;
          break;
        case 'fail':
          this.report.failedTests++;
          break;
        case 'warning':
          this.report.warningTests++;
          break;
      }
      
      await this.log(`测试完成: ${testName} - ${result.status} (${result.duration.toFixed(2)}ms)`);
      return result;
      
    } catch (error) {
      const result: TestResult = {
        testName,
        status: 'fail',
        duration: performance.now() - startTime,
        details: `测试执行失败: ${error}`,
        error: String(error)
      };
      
      this.report.testResults.push(result);
      this.report.summary[category].push(result);
      this.report.failedTests++;
      
      await this.log(`测试失败: ${testName} - ${error}`, 'ERROR');
      return result;
    }
  }

  // 功能测试
  private async runFunctionalTests(): Promise<void> {
    await this.log('开始功能测试...');

    // 测试WordPress API连接
    await this.executeTest('WordPress API连接测试', async () => {
      const response = await axios.get(`${this.config.wordpress.url}/wp-json/wp/v2/posts?per_page=1`);
      
      return {
        testName: 'WordPress API连接测试',
        status: response.status === 200 ? 'pass' : 'fail',
        duration: 0,
        details: `API响应状态: ${response.status}`,
        score: response.status === 200 ? 100 : 0
      };
    }, 'functional');

    // 测试文章列表获取
    await this.executeTest('文章列表获取测试', async () => {
      const response = await axios.get(`${this.config.wordpress.url}/wp-json/wp/v2/posts?per_page=10`);
      const articles = response.data;
      
      const hasRequiredFields = articles.every((article: any) => 
        article.id && article.title && article.content && article.slug
      );
      
      return {
        testName: '文章列表获取测试',
        status: hasRequiredFields ? 'pass' : 'fail',
        duration: 0,
        details: `获取到${articles.length}篇文章，字段完整性: ${hasRequiredFields}`,
        score: hasRequiredFields ? 100 : 0
      };
    }, 'functional');

    // 测试多语言支持
    await this.executeTest('多语言支持测试', async () => {
      const locales = ['zh-CN', 'en-US'];
      const results = [];
      
      for (const locale of locales) {
        try {
          const response = await axios.get(
            `${this.config.wordpress.url}/wp-json/wp/v2/posts?meta_key=locale&meta_value=${locale}&per_page=1`
          );
          results.push({ locale, count: response.data.length });
        } catch (error) {
          results.push({ locale, error: String(error) });
        }
      }
      
      const hasMultiLanguage = results.some(r => !r.error && r.count > 0);
      
      return {
        testName: '多语言支持测试',
        status: hasMultiLanguage ? 'pass' : 'warning',
        duration: 0,
        details: `语言支持情况: ${JSON.stringify(results)}`,
        score: hasMultiLanguage ? 100 : 50
      };
    }, 'functional');

    // 测试媒体文件访问
    await this.executeTest('媒体文件访问测试', async () => {
      const response = await axios.get(`${this.config.wordpress.url}/wp-json/wp/v2/media?per_page=5`);
      const mediaFiles = response.data;
      
      let accessibleCount = 0;
      for (const media of mediaFiles) {
        try {
          const mediaResponse = await axios.head(media.source_url, { timeout: 5000 });
          if (mediaResponse.status === 200) {
            accessibleCount++;
          }
        } catch (error) {
          // 媒体文件不可访问
        }
      }
      
      const accessibilityRate = mediaFiles.length > 0 ? (accessibleCount / mediaFiles.length) * 100 : 0;
      
      return {
        testName: '媒体文件访问测试',
        status: accessibilityRate >= 80 ? 'pass' : accessibilityRate >= 50 ? 'warning' : 'fail',
        duration: 0,
        details: `${accessibleCount}/${mediaFiles.length} 媒体文件可访问 (${accessibilityRate.toFixed(1)}%)`,
        score: accessibilityRate
      };
    }, 'functional');
  }

  // 性能测试
  private async runPerformanceTests(): Promise<void> {
    await this.log('开始性能测试...');

    // API响应时间测试
    await this.executeTest('API响应时间测试', async () => {
      const startTime = performance.now();
      await axios.get(`${this.config.wordpress.url}/wp-json/wp/v2/posts?per_page=20`);
      const responseTime = performance.now() - startTime;
      
      const status = responseTime <= this.config.thresholds.responseTime ? 'pass' : 
                    responseTime <= this.config.thresholds.responseTime * 2 ? 'warning' : 'fail';
      
      return {
        testName: 'API响应时间测试',
        status,
        duration: 0,
        details: `API响应时间: ${responseTime.toFixed(2)}ms`,
        score: Math.max(0, 100 - (responseTime / this.config.thresholds.responseTime) * 50),
        threshold: this.config.thresholds.responseTime
      };
    }, 'performance');

    // 页面加载时间测试
    await this.executeTest('页面加载时间测试', async () => {
      const testUrls = [
        `${this.config.wordpress.url}`,
        `${this.config.wordpress.url}/zh-CN/articles`,
        `${this.config.wordpress.url}/en-US/articles`
      ];
      
      const loadTimes: number[] = [];
      
      for (const url of testUrls) {
        try {
          const startTime = performance.now();
          await axios.get(url, { timeout: 10000 });
          const loadTime = performance.now() - startTime;
          loadTimes.push(loadTime);
        } catch (error) {
          loadTimes.push(10000); // 超时视为10秒
        }
      }
      
      const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
      const status = avgLoadTime <= this.config.thresholds.pageLoadTime ? 'pass' : 
                    avgLoadTime <= this.config.thresholds.pageLoadTime * 2 ? 'warning' : 'fail';
      
      return {
        testName: '页面加载时间测试',
        status,
        duration: 0,
        details: `平均页面加载时间: ${avgLoadTime.toFixed(2)}ms`,
        score: Math.max(0, 100 - (avgLoadTime / this.config.thresholds.pageLoadTime) * 50),
        threshold: this.config.thresholds.pageLoadTime
      };
    }, 'performance');

    // 并发请求测试
    await this.executeTest('并发请求测试', async () => {
      const concurrentRequests = 10;
      const promises = Array.from({ length: concurrentRequests }, () =>
        axios.get(`${this.config.wordpress.url}/wp-json/wp/v2/posts?per_page=5`)
      );
      
      const startTime = performance.now();
      const results = await Promise.allSettled(promises);
      const totalTime = performance.now() - startTime;
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successCount / concurrentRequests) * 100;
      
      return {
        testName: '并发请求测试',
        status: successRate >= 90 ? 'pass' : successRate >= 70 ? 'warning' : 'fail',
        duration: 0,
        details: `${successCount}/${concurrentRequests} 请求成功 (${successRate.toFixed(1)}%), 总耗时: ${totalTime.toFixed(2)}ms`,
        score: successRate
      };
    }, 'performance');
  }

  // SEO测试
  private async runSEOTests(): Promise<void> {
    await this.log('开始SEO测试...');

    // 站点地图测试
    await this.executeTest('站点地图测试', async () => {
      try {
        const response = await axios.get(`${this.config.wordpress.url}/sitemap.xml`);
        const hasSitemap = response.status === 200 && response.data.includes('<urlset');
        
        return {
          testName: '站点地图测试',
          status: hasSitemap ? 'pass' : 'fail',
          duration: 0,
          details: hasSitemap ? '站点地图存在且格式正确' : '站点地图不存在或格式错误',
          score: hasSitemap ? 100 : 0
        };
      } catch (error) {
        return {
          testName: '站点地图测试',
          status: 'fail',
          duration: 0,
          details: '无法访问站点地图',
          score: 0
        };
      }
    }, 'seo');

    // robots.txt测试
    await this.executeTest('robots.txt测试', async () => {
      try {
        const response = await axios.get(`${this.config.wordpress.url}/robots.txt`);
        const hasRobots = response.status === 200 && response.data.includes('User-agent');
        
        return {
          testName: 'robots.txt测试',
          status: hasRobots ? 'pass' : 'warning',
          duration: 0,
          details: hasRobots ? 'robots.txt存在且格式正确' : 'robots.txt不存在或格式错误',
          score: hasRobots ? 100 : 50
        };
      } catch (error) {
        return {
          testName: 'robots.txt测试',
          status: 'warning',
          duration: 0,
          details: '无法访问robots.txt',
          score: 50
        };
      }
    }, 'seo');

    // 页面元数据测试
    await this.executeTest('页面元数据测试', async () => {
      const testUrls = [
        `${this.config.wordpress.url}`,
        `${this.config.wordpress.url}/zh-CN/articles`
      ];
      
      let totalScore = 0;
      const results: string[] = [];
      
      for (const url of testUrls) {
        try {
          const response = await axios.get(url);
          const html = response.data;
          
          const hasTitle = /<title[^>]*>([^<]+)<\/title>/i.test(html);
          const hasDescription = /<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i.test(html);
          const hasKeywords = /<meta[^>]*name=["\']keywords["\'][^>]*>/i.test(html);
          
          const pageScore = (hasTitle ? 40 : 0) + (hasDescription ? 40 : 0) + (hasKeywords ? 20 : 0);
          totalScore += pageScore;
          
          results.push(`${url}: ${pageScore}/100 (标题:${hasTitle}, 描述:${hasDescription}, 关键词:${hasKeywords})`);
        } catch (error) {
          results.push(`${url}: 无法访问`);
        }
      }
      
      const avgScore = totalScore / testUrls.length;
      
      return {
        testName: '页面元数据测试',
        status: avgScore >= this.config.thresholds.seoScore ? 'pass' : avgScore >= 50 ? 'warning' : 'fail',
        duration: 0,
        details: results.join('; '),
        score: avgScore,
        threshold: this.config.thresholds.seoScore
      };
    }, 'seo');
  }

  // 安全测试
  private async runSecurityTests(): Promise<void> {
    await this.log('开始安全测试...');

    // HTTPS测试
    await this.executeTest('HTTPS安全测试', async () => {
      const isHttps = this.config.wordpress.url.startsWith('https://');
      
      return {
        testName: 'HTTPS安全测试',
        status: isHttps ? 'pass' : 'warning',
        duration: 0,
        details: isHttps ? '使用HTTPS协议' : '未使用HTTPS协议，建议启用',
        score: isHttps ? 100 : 50
      };
    }, 'security');

    // API认证测试
    await this.executeTest('API认证测试', async () => {
      try {
        // 测试未认证访问受保护的端点
        const response = await axios.post(`${this.config.wordpress.url}/wp-json/wp/v2/posts`, {
          title: 'Test Post',
          content: 'Test Content',
          status: 'draft'
        });
        
        // 如果能成功创建，说明认证有问题
        return {
          testName: 'API认证测试',
          status: 'fail',
          duration: 0,
          details: '未认证用户可以创建内容，存在安全风险',
          score: 0
        };
      } catch (error: any) {
        // 预期应该返回401或403错误
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;
        
        return {
          testName: 'API认证测试',
          status: isAuthError ? 'pass' : 'warning',
          duration: 0,
          details: isAuthError ? 'API认证正常工作' : `意外的响应: ${error.response?.status}`,
          score: isAuthError ? 100 : 50
        };
      }
    }, 'security');

    // 敏感信息泄露测试
    await this.executeTest('敏感信息泄露测试', async () => {
      const sensitiveEndpoints = [
        '/wp-config.php',
        '/wp-admin/install.php',
        '/.env',
        '/config.json'
      ];
      
      let exposedCount = 0;
      const exposedEndpoints: string[] = [];
      
      for (const endpoint of sensitiveEndpoints) {
        try {
          const response = await axios.get(`${this.config.wordpress.url}${endpoint}`, { timeout: 5000 });
          if (response.status === 200) {
            exposedCount++;
            exposedEndpoints.push(endpoint);
          }
        } catch (error) {
          // 预期应该返回404或403
        }
      }
      
      return {
        testName: '敏感信息泄露测试',
        status: exposedCount === 0 ? 'pass' : 'fail',
        duration: 0,
        details: exposedCount === 0 ? '未发现敏感信息泄露' : `发现${exposedCount}个敏感端点暴露: ${exposedEndpoints.join(', ')}`,
        score: exposedCount === 0 ? 100 : Math.max(0, 100 - exposedCount * 25)
      };
    }, 'security');
  }

  // 可访问性测试
  private async runAccessibilityTests(): Promise<void> {
    await this.log('开始可访问性测试...');

    // 基本可访问性测试
    await this.executeTest('基本可访问性测试', async () => {
      const testUrls = [
        `${this.config.wordpress.url}`,
        `${this.config.wordpress.url}/zh-CN/articles`
      ];
      
      let totalScore = 0;
      const results: string[] = [];
      
      for (const url of testUrls) {
        try {
          const response = await axios.get(url);
          const html = response.data;
          
          // 检查基本可访问性特征
          const hasLang = /<html[^>]*lang\s*=/i.test(html);
          const hasAltTags = /<img[^>]*alt\s*=/i.test(html);
          const hasHeadings = /<h[1-6][^>]*>/i.test(html);
          const hasSkipLinks = /skip.*content|skip.*main/i.test(html);
          
          const pageScore = (hasLang ? 25 : 0) + (hasAltTags ? 25 : 0) + (hasHeadings ? 25 : 0) + (hasSkipLinks ? 25 : 0);
          totalScore += pageScore;
          
          results.push(`${url}: ${pageScore}/100`);
        } catch (error) {
          results.push(`${url}: 无法访问`);
        }
      }
      
      const avgScore = totalScore / testUrls.length;
      
      return {
        testName: '基本可访问性测试',
        status: avgScore >= this.config.thresholds.accessibilityScore ? 'pass' : avgScore >= 50 ? 'warning' : 'fail',
        duration: 0,
        details: results.join('; '),
        score: avgScore,
        threshold: this.config.thresholds.accessibilityScore
      };
    }, 'accessibility');
  }

  // 运行所有测试
  async runAllTests(): Promise<TestSuiteReport> {
    await this.log('开始自动化测试套件...');
    
    try {
      // 功能测试
      if (this.config.tests.functional) {
        await this.runFunctionalTests();
      }
      
      // 性能测试
      if (this.config.tests.performance) {
        await this.runPerformanceTests();
      }
      
      // SEO测试
      if (this.config.tests.seo) {
        await this.runSEOTests();
      }
      
      // 安全测试
      if (this.config.tests.security) {
        await this.runSecurityTests();
      }
      
      // 可访问性测试
      if (this.config.tests.accessibility) {
        await this.runAccessibilityTests();
      }
      
      this.report.endTime = new Date();
      this.report.totalTests = this.report.testResults.length;
      
      // 计算总体分数
      const totalScore = this.report.testResults.reduce((sum, result) => sum + (result.score || 0), 0);
      this.report.overallScore = this.report.totalTests > 0 ? totalScore / this.report.totalTests : 0;
      
      this.generateRecommendations();
      await this.generateTestReport();
      
      await this.log('测试套件执行完成');
      return this.report;
      
    } catch (error) {
      await this.log(`测试套件执行失败: ${error}`, 'ERROR');
      throw error;
    }
  }

  // 生成建议
  private generateRecommendations() {
    const recommendations: string[] = [];
    
    // 基于失败的测试生成建议
    const failedTests = this.report.testResults.filter(t => t.status === 'fail');
    const warningTests = this.report.testResults.filter(t => t.status === 'warning');
    
    if (failedTests.length > 0) {
      recommendations.push(`修复${failedTests.length}个失败的测试项目`);
    }
    
    if (warningTests.length > 0) {
      recommendations.push(`优化${warningTests.length}个警告项目以提升整体质量`);
    }
    
    // 性能建议
    const performanceTests = this.report.summary.performance;
    const slowTests = performanceTests.filter(t => t.score && t.score < 70);
    if (slowTests.length > 0) {
      recommendations.push('优化API响应时间和页面加载性能');
    }
    
    // SEO建议
    const seoTests = this.report.summary.seo;
    const poorSeoTests = seoTests.filter(t => t.score && t.score < 80);
    if (poorSeoTests.length > 0) {
      recommendations.push('完善SEO设置，包括元数据、站点地图和robots.txt');
    }
    
    // 安全建议
    const securityTests = this.report.summary.security;
    const securityIssues = securityTests.filter(t => t.status === 'fail' || t.status === 'warning');
    if (securityIssues.length > 0) {
      recommendations.push('加强安全配置，启用HTTPS和API认证');
    }
    
    // 可访问性建议
    const accessibilityTests = this.report.summary.accessibility;
    const accessibilityIssues = accessibilityTests.filter(t => t.score && t.score < 80);
    if (accessibilityIssues.length > 0) {
      recommendations.push('改善网站可访问性，添加必要的标签和结构');
    }
    
    if (this.report.overallScore >= 90) {
      recommendations.push('系统整体质量优秀，继续保持');
    } else if (this.report.overallScore >= 70) {
      recommendations.push('系统质量良好，可进一步优化细节');
    } else {
      recommendations.push('系统存在较多问题，需要重点关注和改进');
    }
    
    this.report.recommendations = recommendations;
  }

  // 生成测试报告
  private async generateTestReport() {
    const duration = this.report.endTime 
      ? (this.report.endTime.getTime() - this.report.startTime.getTime()) / 1000
      : 0;

    const reportContent = `
# 自动化测试套件报告

## 测试概览
- 测试时间: ${this.report.startTime.toISOString()} - ${this.report.endTime?.toISOString()}
- 总耗时: ${duration.toFixed(2)}秒
- 总测试数: ${this.report.totalTests}
- 通过: ${this.report.passedTests} (${((this.report.passedTests / this.report.totalTests) * 100).toFixed(1)}%)
- 失败: ${this.report.failedTests} (${((this.report.failedTests / this.report.totalTests) * 100).toFixed(1)}%)
- 警告: ${this.report.warningTests} (${((this.report.warningTests / this.report.totalTests) * 100).toFixed(1)}%)
- 总体分数: ${this.report.overallScore.toFixed(2)}/100

## 测试结果详情

### 功能测试 (${this.report.summary.functional.length}项)
${this.report.summary.functional.map(test => `
- **${test.testName}**: ${test.status.toUpperCase()} (${test.score?.toFixed(1) || 'N/A'}/100)
  - 详情: ${test.details}
  - 耗时: ${test.duration.toFixed(2)}ms
`).join('')}

### 性能测试 (${this.report.summary.performance.length}项)
${this.report.summary.performance.map(test => `
- **${test.testName}**: ${test.status.toUpperCase()} (${test.score?.toFixed(1) || 'N/A'}/100)
  - 详情: ${test.details}
  - 阈值: ${test.threshold || 'N/A'}
  - 耗时: ${test.duration.toFixed(2)}ms
`).join('')}

### SEO测试 (${this.report.summary.seo.length}项)
${this.report.summary.seo.map(test => `
- **${test.testName}**: ${test.status.toUpperCase()} (${test.score?.toFixed(1) || 'N/A'}/100)
  - 详情: ${test.details}
  - 耗时: ${test.duration.toFixed(2)}ms
`).join('')}

### 安全测试 (${this.report.summary.security.length}项)
${this.report.summary.security.map(test => `
- **${test.testName}**: ${test.status.toUpperCase()} (${test.score?.toFixed(1) || 'N/A'}/100)
  - 详情: ${test.details}
  - 耗时: ${test.duration.toFixed(2)}ms
`).join('')}

### 可访问性测试 (${this.report.summary.accessibility.length}项)
${this.report.summary.accessibility.map(test => `
- **${test.testName}**: ${test.status.toUpperCase()} (${test.score?.toFixed(1) || 'N/A'}/100)
  - 详情: ${test.details}
  - 耗时: ${test.duration.toFixed(2)}ms
`).join('')}

## 失败的测试
${this.report.testResults.filter(t => t.status === 'fail').map(test => `
- **${test.testName}**: ${test.details}
  ${test.error ? `- 错误: ${test.error}` : ''}
`).join('')}

## 优化建议
${this.report.recommendations.map(rec => `- ${rec}`).join('\n')}

## 下一步行动
1. 修复所有失败的测试项目
2. 优化性能相关的警告项目
3. 完善SEO和可访问性设置
4. 加强安全配置
5. 建立持续集成测试流程
`;

    const reportPath = path.join(process.cwd(), `test-suite-report-${Date.now()}.md`);
    await fs.writeFile(reportPath, reportContent);
    await this.log(`测试报告已生成: ${reportPath}`);
  }
}

// 默认配置
const defaultConfig: TestConfig = {
  wordpress: {
    url: process.env.WORDPRESS_URL || 'http://localhost:8080',
    username: process.env.WORDPRESS_USERNAME || 'admin',
    password: process.env.WORDPRESS_PASSWORD || 'password'
  },
  tests: {
    functional: true,
    performance: true,
    seo: true,
    accessibility: true,
    security: true
  },
  thresholds: {
    responseTime: 1000, // 1秒
    pageLoadTime: 3000, // 3秒
    seoScore: 80,
    accessibilityScore: 70
  }
};

// 主函数
async function main() {
  const testSuite = new AutomatedTestSuite(defaultConfig);
  
  try {
    const report = await testSuite.runAllTests();
    
    console.log('\n✅ 自动化测试完成!');
    console.log(`总测试数: ${report.totalTests}`);
    console.log(`通过: ${report.passedTests}, 失败: ${report.failedTests}, 警告: ${report.warningTests}`);
    console.log(`总体分数: ${report.overallScore.toFixed(2)}/100`);
    
    if (report.failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      report.testResults
        .filter(t => t.status === 'fail')
        .forEach(test => console.log(`- ${test.testName}: ${test.details}`));
    }
    
    console.log('\n主要建议:');
    report.recommendations.slice(0, 3).forEach(rec => console.log(`- ${rec}`));
    
  } catch (error) {
    console.error('❌ 测试套件执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AutomatedTestSuite, type TestConfig, type TestSuiteReport };