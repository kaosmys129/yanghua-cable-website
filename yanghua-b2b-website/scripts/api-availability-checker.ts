#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface APIEndpoint {
  endpoint: string;
  method: string;
  description: string;
  expectedStatus: number;
  requiresAuth: boolean;
}

interface APITestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  responseTime: number;
  error?: string;
  authRequired?: boolean;
}

class WordPressAPIAvailabilityChecker {
  private baseUrl: string;
  private username?: string;
  private password?: string;
  private testResults: APITestResult[] = [];

  constructor(baseUrl: string, username?: string, password?: string) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
  }

  async checkAllEndpoints(): Promise<void> {
    console.log('🔍 开始WordPress REST API可用性检查...\n');

    const endpoints: APIEndpoint[] = [
      // 基础API
      { endpoint: '/wp-json/', method: 'GET', description: 'API根目录', expectedStatus: 200, requiresAuth: false },
      { endpoint: '/wp-json/wp/v2/posts', method: 'GET', description: '文章列表', expectedStatus: 200, requiresAuth: false },
      { endpoint: '/wp-json/wp/v2/pages', method: 'GET', description: '页面列表', expectedStatus: 200, requiresAuth: false },
      { endpoint: '/wp-json/wp/v2/media', method: 'GET', description: '媒体库', expectedStatus: 200, requiresAuth: false },
      { endpoint: '/wp-json/wp/v2/categories', method: 'GET', description: '分类目录', expectedStatus: 200, requiresAuth: false },
      { endpoint: '/wp-json/wp/v2/tags', method: 'GET', description: '标签', expectedStatus: 200, requiresAuth: false },
      
      // 自定义文章类型API
      { endpoint: '/wp-json/wp/v2/projects', method: 'GET', description: '项目自定义类型', expectedStatus: 200, requiresAuth: false },
      { endpoint: '/wp-json/wp/v2/news', method: 'GET', description: '新闻自定义类型', expectedStatus: 200, requiresAuth: false },
      
      // 需要认证的API
      { endpoint: '/wp-json/wp/v2/posts', method: 'POST', description: '创建文章', expectedStatus: 201, requiresAuth: true },
      { endpoint: '/wp-json/wp/v2/media', method: 'POST', description: '上传媒体', expectedStatus: 201, requiresAuth: true },
      { endpoint: '/wp-json/wp/v2/projects', method: 'POST', description: '创建项目', expectedStatus: 201, requiresAuth: true },
      { endpoint: '/wp-json/wp/v2/news', method: 'POST', description: '创建新闻', expectedStatus: 201, requiresAuth: true }
    ];

    // 测试所有端点
    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }

    // 生成报告
    this.generateReport();
  }

  private async testEndpoint(endpoint: APIEndpoint): Promise<void> {
    const url = `${this.baseUrl}${endpoint.endpoint}`;
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 如果需要认证，添加认证头
      if (endpoint.requiresAuth && this.username && this.password) {
        const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        body: endpoint.method !== 'GET' ? JSON.stringify({
          title: '测试文章',
          content: '这是API测试内容',
          status: 'draft'
        }) : undefined
      });

      const responseTime = Date.now() - startTime;
      
      this.testResults.push({
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        status: response.status,
        success: response.status === endpoint.expectedStatus,
        responseTime,
        authRequired: endpoint.requiresAuth
      });

      console.log(`${endpoint.method} ${endpoint.endpoint} - ${response.status} (${responseTime}ms) ${endpoint.requiresAuth ? '[需要认证]' : ''}`);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.testResults.push({
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        status: 0,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : '未知错误'
      });

      console.log(`${endpoint.method} ${endpoint.endpoint} - 错误: ${error} (${responseTime}ms)`);
    }
  }

  private generateReport(): void {
    console.log('\n📊 WordPress REST API可用性检查报告');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const avgResponseTime = this.testResults.reduce((acc, r) => acc + r.responseTime, 0) / totalTests;

    console.log(`总测试数: ${totalTests}`);
    console.log(`成功: ${successfulTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`);

    // 按类别分组结果
    const publicEndpoints = this.testResults.filter(r => !r.authRequired);
    const authEndpoints = this.testResults.filter(r => r.authRequired);

    console.log('\n🌐 公开API端点:');
    publicEndpoints.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.method} ${result.endpoint} (${result.status})`);
    });

    console.log('\n🔐 需要认证的API端点:');
    authEndpoints.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.method} ${result.endpoint} (${result.status})`);
      if (result.error) {
        console.log(`    错误: ${result.error}`);
      }
    });

    // 检查关键端点
    const criticalEndpoints = [
      '/wp-json/',
      '/wp-json/wp/v2/posts',
      '/wp-json/wp/v2/projects',
      '/wp-json/wp/v2/news'
    ];

    console.log('\n🎯 关键端点状态:');
    criticalEndpoints.forEach(endpoint => {
      const result = this.testResults.find(r => r.endpoint === endpoint && r.method === 'GET');
      if (result) {
        const status = result.success ? '🟢 可用' : '🔴 不可用';
        console.log(`  ${status}: ${endpoint}`);
      } else {
        console.log(`  ⚪ 未测试: ${endpoint}`);
      }
    });

    // 生成建议
    this.generateRecommendations();

    // 保存详细报告
    const reportPath = path.join(__dirname, '..', 'api-availability-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        avgResponseTime
      },
      results: this.testResults
    }, null, 2));
    
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  }

  private generateRecommendations(): void {
    console.log('\n💡 建议:');
    
    const failedEndpoints = this.testResults.filter(r => !r.success);
    
    if (failedEndpoints.length > 0) {
      console.log('1. 检查WordPress REST API是否已启用');
      console.log('2. 确保所需的插件已安装并激活');
      console.log('3. 检查服务器配置和权限设置');
      console.log('4. 验证URL和端口配置是否正确');
      
      // 检查是否需要安装REST API插件
      const hasRESTAPI = this.testResults.some(r => r.endpoint === '/wp-json/' && r.success);
      if (!hasRESTAPI) {
        console.log('5. 考虑安装并启用WordPress REST API插件');
      }
    } else {
      console.log('✅ 所有API端点工作正常，可以继续数据迁移');
    }
  }
}

// 执行检查
const baseUrl = process.env.WP_BASE_URL || 'http://localhost:8080';
const username = process.env.WP_USERNAME;
const password = process.env.WP_PASSWORD;

const checker = new WordPressAPIAvailabilityChecker(baseUrl, username, password);

checker.checkAllEndpoints().catch(console.error);