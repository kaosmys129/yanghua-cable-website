# SEO关键词分析模块

这是一个完整的网站SEO关键词分析工具，可以自动扫描网站页面，分析关键词分布，评估SEO效果，并生成详细的优化报告。

## 功能特性

### 🔍 全面的关键词分析
- **多类型关键词支持**: 核心关键词、长尾关键词、品牌词、地域词等
- **精确位置检测**: 标题、Meta描述、H标签、正文内容
- **密度计算**: 智能计算关键词密度和频率
- **竞争分析**: 评估关键词布局的SEO有效性

### 📊 智能SEO评估
- **多维度评分**: 标题优化、Meta描述、标题结构、关键词密度、内容质量
- **问题识别**: 自动检测SEO问题和优化机会
- **建议生成**: 提供具体的优化建议和改进方案
- **关键词堆砌检测**: 防止过度优化

### 📈 详细报告生成
- **多格式导出**: HTML、JSON、CSV、Markdown
- **可视化图表**: 直观展示分析结果
- **批量处理**: 支持整站分析和批量导出
- **自定义配置**: 灵活的报告配置选项

## 安装依赖

```bash
npm install jsdom @types/jsdom
```

## 快速开始

### 1. 基础使用

```typescript
import { KeywordAnalyzer, KeywordType } from '@/lib/seo';

// 创建分析器
const analyzer = new KeywordAnalyzer('https://your-website.com');

// 配置关键词
analyzer.setKeywords([
  { keyword: '核心关键词', type: KeywordType.CORE, priority: 10, targetDensity: 2.5 },
  { keyword: '长尾关键词', type: KeywordType.LONG_TAIL, priority: 5, targetDensity: 1.5 }
]);

// 分析网站
const report = await analyzer.analyzeSite();
console.log('整体评分:', report.overallScore);
```

### 2. 一键分析

```typescript
import { quickAnalysis, DEFAULT_KEYWORDS, ReportFormat } from '@/lib/seo';

// 快速分析并导出报告
const { report, exportResults } = await quickAnalysis(
  'https://your-website.com',
  DEFAULT_KEYWORDS,
  [ReportFormat.HTML, ReportFormat.JSON]
);
```

### 3. 自定义配置

```typescript
import { createAnalyzer } from '@/lib/seo';

// 使用预配置分析器
const analyzer = createAnalyzer('https://your-website.com', customKeywords);
analyzer.setMaxPages(50);
analyzer.setCrawlDelay(1000);

const report = await analyzer.analyzeSite();
```

## 核心类和接口

### KeywordAnalyzer
主要的分析器类，负责网站扫描和关键词分析。

```typescript
class KeywordAnalyzer {
  constructor(baseUrl: string, keywords?: KeywordConfig[])
  
  // 配置方法
  setKeywords(keywords: KeywordConfig[]): void
  setMaxPages(maxPages: number): void
  setCrawlDelay(delay: number): void
  
  // 分析方法
  analyzePage(url: string): Promise<PageAnalysisResult>
  analyzeSite(): Promise<SiteAnalysisReport>
}
```

### 关键词配置

```typescript
interface KeywordConfig {
  keyword: string;           // 关键词文本
  type: KeywordType;         // 关键词类型
  priority: number;          // 优先级 (1-10)
  targetDensity?: number;    // 目标密度 (%)
  variations?: string[];     // 变体词
}

enum KeywordType {
  CORE = 'core',            // 核心关键词
  LONG_TAIL = 'long_tail',  // 长尾关键词
  BRAND = 'brand',          // 品牌词
  SECONDARY = 'secondary',  // 次要关键词
  GEOGRAPHIC = 'geographic' // 地域词
}
```

### 分析结果

```typescript
interface SiteAnalysisReport {
  baseUrl: string;
  analyzedPages: number;
  overallScore: number;
  keywordCoverage: number;
  pageResults: PageAnalysisResult[];
  summary: {
    averageScore: number;
    bestPerformingPages: string[];
    worstPerformingPages: string[];
    commonIssues: string[];
  };
  recommendations: string[];
}
```

## 报告生成和导出

### 生成报告

```typescript
import { ReportGenerator, ReportFormat } from '@/lib/seo';

const generator = new ReportGenerator();

// 生成HTML报告
const htmlReport = generator.generateReport(report, ReportFormat.HTML);

// 生成JSON报告
const jsonReport = generator.generateReport(report, ReportFormat.JSON);
```

### 导出文件

```typescript
import { ReportExporter } from '@/lib/seo';

const exporter = new ReportExporter();

// 导出单个报告
const result = await exporter.exportReport(report, {
  format: ReportFormat.HTML,
  filename: 'seo-analysis',
  outputDir: './reports'
});

// 批量导出
const results = await exporter.exportMultipleFormats(report, [
  ReportFormat.HTML,
  ReportFormat.JSON,
  ReportFormat.CSV
]);
```

## 配置选项

### 默认关键词配置

```typescript
export const DEFAULT_KEYWORDS = [
  { keyword: 'flexible busbar', type: KeywordType.CORE, priority: 10, targetDensity: 2.5 },
  { keyword: 'copper busbar', type: KeywordType.CORE, priority: 9, targetDensity: 2.0 },
  { keyword: 'electrical busbar', type: KeywordType.CORE, priority: 8, targetDensity: 1.8 },
  // ... 更多关键词
];
```

### SEO配置

```typescript
export const DEFAULT_SEO_CONFIG = {
  maxPages: 50,                    // 最大分析页面数
  crawlDelay: 1000,               // 爬取延迟 (ms)
  targetDensityRange: { min: 0.5, max: 3.0 }, // 目标密度范围
  minWordCount: 300,              // 最小字数
  maxTitleLength: 60,             // 最大标题长度
  maxMetaDescriptionLength: 160   // 最大描述长度
};
```

## 评分标准

### 整体评分 (0-100分)
- **标题优化** (25%): 关键词在标题中的使用情况
- **Meta描述** (20%): 描述的质量和关键词包含
- **标题结构** (20%): H1-H6标签的合理使用
- **关键词密度** (20%): 关键词在内容中的分布
- **内容质量** (15%): 内容长度、可读性等

### 评分等级
- **90-100分**: 优秀 - SEO优化非常好
- **80-89分**: 良好 - 有一些优化空间
- **70-79分**: 一般 - 需要改进
- **60-69分**: 较差 - 需要大幅优化
- **0-59分**: 很差 - 需要全面重构

## 常见问题和解决方案

### 1. 关键词密度过高
**问题**: 关键词堆砌，影响用户体验
**解决**: 
- 减少关键词重复
- 使用同义词和变体
- 增加内容长度

### 2. 标题优化不足
**问题**: 标题中缺少关键词或标题过长
**解决**:
- 在标题前部放置核心关键词
- 控制标题长度在60字符以内
- 使用吸引人的标题格式

### 3. Meta描述缺失
**问题**: 页面没有Meta描述或描述质量差
**解决**:
- 为每个页面添加独特的Meta描述
- 在描述中包含关键词
- 控制长度在160字符以内

### 4. 内容质量不足
**问题**: 内容过短或缺乏相关性
**解决**:
- 增加内容长度至少300字
- 提高内容相关性和价值
- 合理使用H标签结构

## 最佳实践

### 1. 关键词策略
- **核心关键词**: 2-3个，密度控制在2-3%
- **长尾关键词**: 5-10个，密度控制在1-2%
- **品牌词**: 适量使用，避免过度重复

### 2. 内容优化
- **标题**: 包含核心关键词，长度50-60字符
- **描述**: 包含关键词，长度150-160字符
- **正文**: 自然融入关键词，避免堆砌

### 3. 技术SEO
- **页面速度**: 确保快速加载
- **移动友好**: 响应式设计
- **结构化数据**: 使用Schema标记

### 4. 监控和优化
- **定期分析**: 每月进行一次全站分析
- **持续优化**: 根据报告建议进行改进
- **效果跟踪**: 监控关键词排名变化

## 示例项目

查看 `src/examples/seo-analysis-example.ts` 文件获取完整的使用示例。

## 技术架构

```
src/lib/seo/
├── index.ts                    # 模块入口
├── KeywordAnalyzer.ts          # 核心分析器
├── ContentExtractor.ts         # 内容提取器
├── KeywordDensityCalculator.ts # 密度计算器
├── SEOEvaluationEngine.ts      # SEO评估引擎
├── ReportGenerator.ts          # 报告生成器
└── ReportExporter.ts           # 报告导出器
```

## 依赖说明

- **jsdom**: 用于HTML解析和DOM操作
- **@types/jsdom**: TypeScript类型定义
- **原生fetch**: Node.js 18+支持的网络请求API

## 许可证

MIT License

## 贡献指南

欢迎提交Issue和Pull Request来改进这个模块。

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的关键词分析功能
- 多格式报告导出
- SEO评估和建议生成