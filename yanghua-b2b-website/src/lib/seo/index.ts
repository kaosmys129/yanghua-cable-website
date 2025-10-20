/**
 * SEO关键词检测测试模块
 * 
 * 这个模块提供了完整的网站关键词分析功能，包括：
 * - 自动扫描全站页面
 * - 检测关键词在页面各个位置的分布
 * - 计算关键词密度和频率
 * - 评估SEO有效性
 * - 生成详细的分析报告
 * - 导出多种格式的报告
 */

// 核心分析器
export { KeywordAnalyzer } from './KeywordAnalyzer';
export { KeywordType } from './KeywordAnalyzer';
export type { 
  KeywordConfig, 
  PageContent, 
  KeywordAnalysis, 
  PageAnalysisResult, 
  SiteAnalysisReport 
} from './KeywordAnalyzer';

// 内容提取器
export { ContentExtractor } from './ContentExtractor';

// 关键词密度计算器
export { KeywordDensityCalculator } from './KeywordDensityCalculator';

// SEO评估引擎
export { SEOEvaluationEngine } from './SEOEvaluationEngine';
export type { SEORule, SEOEvaluationResult } from './SEOEvaluationEngine';

// 报告生成器
export { ReportGenerator } from './ReportGenerator';
export { ReportFormat } from './ReportGenerator';
export type { ReportConfig } from './ReportGenerator';

// 报告导出器
export { ReportExporter } from './ReportExporter';
export type { ExportOptions, ExportResult } from './ReportExporter';

// 导入类型用于内部使用
import { KeywordType } from './KeywordAnalyzer';
import { KeywordAnalyzer } from './KeywordAnalyzer';
import { ReportFormat } from './ReportGenerator';
import { ReportExporter } from './ReportExporter';
import type { SiteAnalysisReport } from './KeywordAnalyzer';

/**
 * 快速开始示例
 * 
 * ```typescript
 * import { KeywordAnalyzer, KeywordType, ReportExporter, ReportFormat } from '@/lib/seo';
 * 
 * // 1. 创建关键词分析器
 * const analyzer = new KeywordAnalyzer('https://example.com');
 * 
 * // 2. 配置关键词
 * analyzer.setKeywords([
 *   { keyword: '核心关键词', type: KeywordType.CORE, priority: 10 },
 *   { keyword: '长尾关键词', type: KeywordType.LONG_TAIL, priority: 5 }
 * ]);
 * 
 * // 3. 分析网站
 * const report = await analyzer.analyzeSite();
 * 
 * // 4. 导出报告
 * const exporter = new ReportExporter();
 * await exporter.exportReport(report, { 
 *   format: ReportFormat.HTML,
 *   filename: 'seo-analysis'
 * });
 * ```
 */

/**
 * 默认关键词配置示例
 */
export const DEFAULT_KEYWORDS = [
  // 核心关键词示例
  { keyword: 'flexible busbar', type: KeywordType.CORE, priority: 10, targetDensity: 2.5 },
  { keyword: 'copper busbar', type: KeywordType.CORE, priority: 9, targetDensity: 2.0 },
  { keyword: 'electrical busbar', type: KeywordType.CORE, priority: 8, targetDensity: 1.8 },
  
  // 长尾关键词示例
  { keyword: 'flexible copper busbar manufacturer', type: KeywordType.LONG_TAIL, priority: 7, targetDensity: 1.5 },
  { keyword: 'high current busbar solution', type: KeywordType.LONG_TAIL, priority: 6, targetDensity: 1.2 },
  { keyword: 'custom busbar design', type: KeywordType.LONG_TAIL, priority: 5, targetDensity: 1.0 }
];

/**
 * 默认SEO配置
 */
export const DEFAULT_SEO_CONFIG = {
  maxPages: 50,
  crawlDelay: 1000,
  targetDensityRange: { min: 0.5, max: 3.0 },
  minWordCount: 300,
  maxTitleLength: 60,
  maxMetaDescriptionLength: 160
};

/**
 * 创建预配置的分析器实例
 */
export function createAnalyzer(
  baseUrl: string, 
  keywords = DEFAULT_KEYWORDS,
  config = DEFAULT_SEO_CONFIG
): KeywordAnalyzer {
  const analyzer = new KeywordAnalyzer(baseUrl, keywords);
  analyzer.setMaxPages(config.maxPages);
  analyzer.setCrawlDelay(config.crawlDelay);
  return analyzer;
}

/**
 * 快速分析函数
 * 提供一键式分析功能
 */
export async function quickAnalysis(
  baseUrl: string,
  keywords = DEFAULT_KEYWORDS,
  exportFormats: ReportFormat[] = [ReportFormat.HTML, ReportFormat.JSON]
): Promise<{ report: SiteAnalysisReport; exportResults: any[] }> {
  // 创建分析器
  const analyzer = createAnalyzer(baseUrl, keywords);
  
  // 执行分析
  const report = await analyzer.analyzeSite();
  
  // 导出报告
  const exporter = new ReportExporter();
  const exportResults = await exporter.exportMultipleFormats(report, exportFormats);
  
  return { report, exportResults };
}