import { test, expect, Page } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

interface ErrorReport {
  timestamp: string;
  url: string;
  userAgent: string;
  viewport: string;
  errors: {
    consoleErrors: Array<{
      type: string;
      text: string;
      location?: string;
      stack?: string;
    }>;
    networkErrors: Array<{
      url: string;
      status: number;
      statusText: string;
      method: string;
    }>;
    javascriptErrors: Array<{
      message: string;
      source: string;
      line: number;
      column: number;
      stack?: string;
    }>;
    performanceIssues: Array<{
      metric: string;
      value: number;
      threshold: number;
      severity: 'warning' | 'error';
    }>;
  };
  pageLoadMetrics: {
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
}

class ErrorCollector {
  private errors: ErrorReport['errors'] = {
    consoleErrors: [],
    networkErrors: [],
    javascriptErrors: [],
    performanceIssues: []
  };
  
  private performanceMetrics: ErrorReport['pageLoadMetrics'] = {
    domContentLoaded: 0,
    loadComplete: 0
  };

  async setupErrorCollection(page: Page) {
    // 收集控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        this.errors.consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location()?.url || 'unknown'
        });
      }
    });

    // 收集网络错误
    page.on('response', response => {
      if (response.status() >= 400) {
        this.errors.networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          method: response.request().method()
        });
      }
    });

    // 收集JavaScript错误
    page.on('pageerror', error => {
      this.errors.javascriptErrors.push({
        message: error.message,
        source: error.stack?.split('\n')[0] || 'unknown',
        line: 0,
        column: 0,
        stack: error.stack
      });
    });

    // 注入性能监控代码
    await page.addInitScript(() => {
      // 监控性能指标
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType('paint');
          
          (window as any).__performanceData = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            largestContentfulPaint: 0 // 需要额外的LCP监控
          };
        }, 1000);
      });

      // 监控大型内容绘制 (LCP)
      if ('web-vitals' in window || typeof (window as any).PerformanceObserver !== 'undefined') {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            (window as any).__performanceData = {
              ...(window as any).__performanceData,
              largestContentfulPaint: lastEntry.startTime
            };
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          console.warn('LCP monitoring not supported');
        }
      }
    });
  }

  async collectPerformanceMetrics(page: Page) {
    const performanceData = await page.evaluate(() => (window as any).__performanceData || {});
    this.performanceMetrics = {
      domContentLoaded: performanceData.domContentLoaded || 0,
      loadComplete: performanceData.loadComplete || 0,
      firstContentfulPaint: performanceData.firstContentfulPaint,
      largestContentfulPaint: performanceData.largestContentfulPaint
    };

    // 检查性能阈值
    const thresholds = {
      domContentLoaded: 2000, // 2秒
      loadComplete: 5000,     // 5秒
      firstContentfulPaint: 1500, // 1.5秒
      largestContentfulPaint: 2500 // 2.5秒
    };

    Object.entries(this.performanceMetrics).forEach(([metric, value]) => {
      if (value && thresholds[metric as keyof typeof thresholds]) {
        const threshold = thresholds[metric as keyof typeof thresholds];
        if (value > threshold) {
          this.errors.performanceIssues.push({
            metric,
            value,
            threshold,
            severity: value > threshold * 1.5 ? 'error' : 'warning'
          });
        }
      }
    });
  }

  generateReport(page: Page, url: string): ErrorReport {
    const viewport = page.viewportSize();
    return {
      timestamp: new Date().toISOString(),
      url,
      userAgent: 'Playwright Test',
      viewport: viewport ? `${viewport.width}x${viewport.height}` : 'unknown',
      errors: { ...this.errors },
      pageLoadMetrics: { ...this.performanceMetrics }
    };
  }

  reset() {
    this.errors = {
      consoleErrors: [],
      networkErrors: [],
      javascriptErrors: [],
      performanceIssues: []
    };
    this.performanceMetrics = {
      domContentLoaded: 0,
      loadComplete: 0
    };
  }
}

test.describe('错误收集和性能监控', () => {
  let collector: ErrorCollector;
  let allReports: ErrorReport[] = [];

  test.beforeEach(async () => {
    collector = new ErrorCollector();
  });

  test.afterAll(async () => {
    // 保存错误报告
    const reportPath = path.join(process.cwd(), 'test-results', 'error-collection-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalErrors: allReports.reduce((sum, report) => 
        sum + 
        report.errors.consoleErrors.length + 
        report.errors.networkErrors.length + 
        report.errors.javascriptErrors.length + 
        report.errors.performanceIssues.length
      , 0),
      reports: allReports
    }, null, 2));

    console.log(`错误收集报告已保存到: ${reportPath}`);
  });

  const pagesToTest = [
    { name: '首页', url: '/' },
    { name: '英文首页', url: '/en' },
    { name: '西班牙语首页', url: '/es' },
    { name: '产品页面', url: '/en/products' },
    { name: '解决方案页面', url: '/en/solutions' },
    { name: '项目案例页面', url: '/en/projects' },
    { name: '新闻页面', url: '/en/news' },
    { name: '关于我们页面', url: '/en/about' },
    { name: '联系我们页面', url: '/en/contact' },
  ];

  pagesToTest.forEach(({ name, url }) => {
    test(`收集 ${name} 的错误信息`, async ({ page }) => {
      await collector.setupErrorCollection(page);
      
      try {
        // 导航到页面
        await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        // 等待页面完全加载
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        // 收集性能指标
        await collector.collectPerformanceMetrics(page);

        // 执行基本交互测试
        await test.step('基本交互测试', async () => {
          // 尝试点击导航菜单
          const navElements = await page.locator('nav a').all();
          for (let i = 0; i < Math.min(navElements.length, 3); i++) {
            try {
              await navElements[i].hover({ timeout: 2000 });
            } catch (error) {
              console.log(`导航元素 ${i} 悬停失败:`, error);
            }
          }

          // 尝试滚动页面
          await page.evaluate(() => {
            window.scrollTo(0, window.innerHeight);
          });
          await page.waitForTimeout(1000);

          // 检查图片加载
          const images = await page.locator('img').all();
          for (const img of images.slice(0, 5)) {
            try {
              await expect(img).toBeVisible({ timeout: 5000 });
            } catch (error) {
              console.log('图片加载检查失败:', error);
            }
          }
        });

        // 生成报告
        const report = collector.generateReport(page, url);
        allReports.push(report);

        // 输出当前页面的错误统计
        const errorCount = report.errors.consoleErrors.length + 
                          report.errors.networkErrors.length + 
                          report.errors.javascriptErrors.length + 
                          report.errors.performanceIssues.length;

        console.log(`\n=== ${name} 错误报告 ===`);
        console.log(`控制台错误: ${report.errors.consoleErrors.length}`);
        console.log(`网络错误: ${report.errors.networkErrors.length}`);
        console.log(`JavaScript错误: ${report.errors.javascriptErrors.length}`);
        console.log(`性能问题: ${report.errors.performanceIssues.length}`);
        console.log(`页面加载时间: ${report.pageLoadMetrics.loadComplete}ms`);

        if (report.errors.consoleErrors.length > 0) {
          console.log('控制台错误详情:');
          report.errors.consoleErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.text} (${error.location})`);
          });
        }

        if (report.errors.networkErrors.length > 0) {
          console.log('网络错误详情:');
          report.errors.networkErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.method} ${error.url} - ${error.status} ${error.statusText}`);
          });
        }

        if (report.errors.javascriptErrors.length > 0) {
          console.log('JavaScript错误详情:');
          report.errors.javascriptErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.message} (${error.source})`);
          });
        }

        // 重置收集器
        collector.reset();

      } catch (error) {
        console.error(`页面 ${name} 加载失败:`, error);
        
        // 即使页面加载失败，也要生成错误报告
        const report = collector.generateReport(page, url);
        report.errors.javascriptErrors.push({
          message: `页面加载失败: ${error}`,
          source: 'test-automation',
          line: 0,
          column: 0,
          stack: error instanceof Error ? error.stack : undefined
        });
        allReports.push(report);
        
        throw error;
      }
    });
  });

  test('API端点健康检查', async ({ request }) => {
    const apiEndpoints = [
      '/api/health',
      '/api/projects',
      '/api/articles',
      '/api/strapi-health',
    ];

    const apiErrors: Array<{
      endpoint: string;
      error: string;
      status?: number;
    }> = [];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await request.get(endpoint);
        if (!response.ok()) {
          apiErrors.push({
            endpoint,
            error: `HTTP ${response.status()} - ${response.statusText()}`,
            status: response.status()
          });
        }
      } catch (error) {
        apiErrors.push({
          endpoint,
          error: `请求失败: ${error}`
        });
      }
    }

    if (apiErrors.length > 0) {
      console.log('\n=== API错误报告 ===');
      apiErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.endpoint}: ${error.error}`);
      });
    }

    // 将API错误添加到报告中
    if (apiErrors.length > 0) {
      allReports.push({
        timestamp: new Date().toISOString(),
        url: 'API健康检查',
        userAgent: 'Playwright Test',
        viewport: 'N/A',
        errors: {
          consoleErrors: [],
          networkErrors: apiErrors.map(error => ({
            url: error.endpoint,
            status: error.status || 0,
            statusText: error.error,
            method: 'GET'
          })),
          javascriptErrors: [],
          performanceIssues: []
        },
        pageLoadMetrics: {
          domContentLoaded: 0,
          loadComplete: 0
        }
      });
    }
  });
});