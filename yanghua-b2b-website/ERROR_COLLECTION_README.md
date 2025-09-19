# 网页错误收集和性能监控系统

## 概述

这个自动化测试系统专门设计用于检测和收集阳华B2B网站在本地运行时的各种错误和性能问题。系统会自动访问各个页面，收集错误信息，并生成详细的HTML报告。

## 功能特性

### 🔍 错误检测
- **控制台错误**: 捕获JavaScript控制台中的所有错误信息
- **网络错误**: 监测HTTP请求失败和4xx/5xx状态码
- **JavaScript运行时错误**: 捕获未处理的JavaScript异常
- **性能问题**: 检测超过阈值的页面加载时间

### 📊 性能监控
- **DOM加载时间**: 监测DOMContentLoaded事件
- **页面完整加载时间**: 监测load事件完成时间
- **首次内容绘制 (FCP)**: 测量First Contentful Paint
- **最大内容绘制 (LCP)**: 测量Largest Contentful Paint
- **性能阈值检查**: 自动标记超过预设阈值的页面

### 📱 多设备测试
- **桌面浏览器**: Chrome, Firefox, Safari, Edge
- **移动设备**: 模拟 iPhone 12 和 Pixel 5
- **响应式测试**: 检测不同视口下的问题

## 快速开始

### 1. 确保前端服务运行
```bash
npm run dev
```
确保本地开发服务器在 http://localhost:3000 正常运行。

### 2. 运行错误收集测试
```bash
# 仅运行错误收集测试
npm run test:error-collection

# 运行测试并生成HTML报告
npm run error-analysis
```

### 3. 查看报告
测试完成后，会在以下位置生成报告：
- **JSON报告**: `test-results/error-collection-report.json`
- **HTML报告**: `test-results/error-report.html`

## 测试覆盖的页面

系统会自动测试以下页面：
- 首页 (`/`)
- 英文首页 (`/en`)
- 西班牙语首页 (`/es`)
- 产品页面 (`/en/products`)
- 解决方案页面 (`/en/solutions`)
- 项目案例页面 (`/en/projects`)
- 新闻页面 (`/en/news`)
- 关于我们页面 (`/en/about`)
- 联系我们页面 (`/en/contact`)

## 错误类型说明

### 🚨 控制台错误
通常包括：
- JavaScript语法错误
- 未定义的变量或函数
- 网络请求失败
- 资源加载失败

### 🌐 网络错误
包括：
- 404 - 页面或资源未找到
- 500 - 服务器内部错误
- 403 - 权限拒绝
- 超时错误

### ⚡ JavaScript错误
包括：
- 运行时异常
- 类型错误
- 引用错误
- 语法错误

### 🔥 性能问题
基于以下阈值检测：
- **DOM加载**: >2秒 (警告), >3秒 (错误)
- **页面完整加载**: >5秒 (警告), >7.5秒 (错误)
- **首次内容绘制**: >1.5秒 (警告), >2.25秒 (错误)
- **最大内容绘制**: >2.5秒 (警告), >3.75秒 (错误)

## 高级用法

### 单独运行特定测试
```bash
# 只测试特定页面
npx playwright test tests/e2e/error-collection.spec.ts --grep "首页"

# 在UI模式下运行（可视化调试）
npm run test:ui

# 调试模式
npm run test:debug
```

### 自定义配置
可以在 `playwright.config.ts` 中修改：
- 测试超时时间
- 浏览器类型
- 并发数量
- 输出目录

### 生成独立报告
```bash
# 仅生成HTML报告（基于已有的JSON数据）
npm run test:report
```

## 报告解读

### 📊 概览卡片
- **总错误数量**: 所有类型错误的总和
- **测试页面数**: 成功测试的页面数量
- **性能警告**: 性能问题的警告数量
- **平均加载时间**: 所有页面的平均加载时间

### 📋 详细报告
- 每个错误都包含完整的上下文信息
- 性能指标以图形化方式展示
- 可折叠的错误详情
- 错误源文件和堆栈信息

### 🎯 优先级指导
1. **高优先级**: JavaScript错误和网络错误
2. **中优先级**: 性能错误（>阈值1.5倍）
3. **低优先级**: 性能警告和控制台警告

## 故障排除

### 常见问题

#### 测试无法启动
```bash
# 检查依赖
npm install

# 检查Playwright安装
npx playwright install
```

#### 前端服务连接失败
```bash
# 确保开发服务器运行
npm run dev

# 检查端口是否被占用
lsof -i :3000
```

#### 权限错误
```bash
# macOS/Linux
chmod +x scripts/*.ts

# Windows (以管理员身份运行)
```

### 调试技巧

#### 1. 查看详细日志
```bash
DEBUG=pw:* npm run test:error-collection
```

#### 2. 保留浏览器窗口
在 `playwright.config.ts` 中设置：
```typescript
use: {
  headless: false,
  slowMo: 1000
}
```

#### 3. 截图调试
测试失败时会自动截图，保存在 `test-results/` 目录。

## 集成到CI/CD

### GitHub Actions 示例
```yaml
name: Error Collection Test
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  error-collection:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npx playwright install
    - run: npm run build
    - run: npm run error-analysis
    - uses: actions/upload-artifact@v3
      with:
        name: error-reports
        path: test-results/
```

## 自定义和扩展

### 添加新页面测试
在 `tests/e2e/error-collection.spec.ts` 的 `pagesToTest` 数组中添加：
```typescript
{ name: '新页面', url: '/new-page' }
```

### 修改性能阈值
在 `ErrorCollector.collectPerformanceMetrics()` 方法中修改：
```typescript
const thresholds = {
  domContentLoaded: 2000,  // 自定义阈值
  loadComplete: 5000,
  // ...
};
```

### 添加新的错误类型
扩展 `ErrorReport` 接口和相应的收集逻辑：
```typescript
interface ErrorReport {
  // ... 现有字段
  customErrors: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}
```

## 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：
1. 查看本文档的故障排除部分
2. 检查 `test-results/` 目录中的详细日志
3. 联系开发团队获取技术支持

---

**版本**: 1.0.0  
**最后更新**: 2025-09-20  
**维护团队**: 阳华B2B网站开发组