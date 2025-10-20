import { SiteAnalysisReport } from './KeywordAnalyzer';
import { ReportGenerator, ReportFormat, ReportConfig } from './ReportGenerator';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 导出选项接口
 */
export interface ExportOptions {
  format: ReportFormat;
  filename?: string;
  outputDir?: string;
  includeTimestamp?: boolean;
  compress?: boolean;
}

/**
 * 导出结果接口
 */
export interface ExportResult {
  success: boolean;
  filePath?: string;
  filename?: string;
  size?: number;
  error?: string;
}

/**
 * 报告导出器类
 * 负责将分析报告导出为各种格式的文件
 */
export class ReportExporter {
  private reportGenerator: ReportGenerator;
  private defaultOutputDir: string;

  constructor(outputDir: string = './reports') {
    this.reportGenerator = new ReportGenerator();
    this.defaultOutputDir = outputDir;
    this.ensureOutputDirectory();
  }

  /**
   * 导出报告到文件
   */
  async exportReport(
    analysisReport: SiteAnalysisReport, 
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // 配置报告生成器
      const reportConfig: ReportConfig = {
        format: options.format,
        includeDetails: true,
        includeSuggestions: true,
        includeCharts: false
      };
      
      this.reportGenerator.updateConfig(reportConfig);

      // 生成报告内容
      const reportContent = this.reportGenerator.generateReport(analysisReport);

      // 生成文件名
      const filename = this.generateFilename(analysisReport, options);
      const outputDir = options.outputDir || this.defaultOutputDir;
      const filePath = path.join(outputDir, filename);

      // 确保输出目录存在
      this.ensureDirectory(outputDir);

      // 写入文件
      await fs.promises.writeFile(filePath, reportContent, 'utf-8');

      // 获取文件大小
      const stats = await fs.promises.stat(filePath);

      return {
        success: true,
        filePath,
        filename,
        size: stats.size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 批量导出多种格式
   */
  async exportMultipleFormats(
    analysisReport: SiteAnalysisReport,
    formats: ReportFormat[],
    baseOptions: Omit<ExportOptions, 'format'> = {}
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const format of formats) {
      const options: ExportOptions = {
        ...baseOptions,
        format
      };

      const result = await this.exportReport(analysisReport, options);
      results.push(result);
    }

    return results;
  }

  /**
   * 导出为浏览器下载
   * 返回可用于浏览器下载的数据
   */
  generateDownloadData(
    analysisReport: SiteAnalysisReport,
    format: ReportFormat
  ): { content: string; filename: string; mimeType: string } {
    const reportConfig: ReportConfig = {
      format,
      includeDetails: true,
      includeSuggestions: true,
      includeCharts: false
    };

    this.reportGenerator.updateConfig(reportConfig);
    const content = this.reportGenerator.generateReport(analysisReport);
    
    const filename = this.generateFilename(analysisReport, { 
      format, 
      includeTimestamp: true 
    });

    const mimeType = this.getMimeType(format);

    return { content, filename, mimeType };
  }

  /**
   * 创建压缩包（包含多种格式）
   */
  async createReportPackage(
    analysisReport: SiteAnalysisReport,
    formats: ReportFormat[] = [ReportFormat.HTML, ReportFormat.JSON, ReportFormat.CSV],
    outputDir?: string
  ): Promise<ExportResult> {
    try {
      const packageDir = path.join(
        outputDir || this.defaultOutputDir,
        `seo-report-${this.getTimestamp()}`
      );

      // 创建包目录
      this.ensureDirectory(packageDir);

      // 导出所有格式到包目录
      const results = await this.exportMultipleFormats(
        analysisReport,
        formats,
        { outputDir: packageDir, includeTimestamp: false }
      );

      // 检查是否有失败的导出
      const failedExports = results.filter(r => !r.success);
      if (failedExports.length > 0) {
        throw new Error(`Failed to export ${failedExports.length} formats`);
      }

      // 创建README文件
      await this.createPackageReadme(packageDir, analysisReport, results);

      return {
        success: true,
        filePath: packageDir,
        filename: path.basename(packageDir)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 生成文件名
   */
  private generateFilename(
    analysisReport: SiteAnalysisReport,
    options: ExportOptions
  ): string {
    const baseFilename = options.filename || 'seo-keyword-analysis';
    const timestamp = options.includeTimestamp !== false ? 
      `_${this.getTimestamp()}` : '';
    const extension = this.getFileExtension(options.format);

    return `${baseFilename}${timestamp}.${extension}`;
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.JSON:
        return 'json';
      case ReportFormat.HTML:
        return 'html';
      case ReportFormat.CSV:
        return 'csv';
      case ReportFormat.MARKDOWN:
        return 'md';
      default:
        return 'txt';
    }
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.JSON:
        return 'application/json';
      case ReportFormat.HTML:
        return 'text/html';
      case ReportFormat.CSV:
        return 'text/csv';
      case ReportFormat.MARKDOWN:
        return 'text/markdown';
      default:
        return 'text/plain';
    }
  }

  /**
   * 获取时间戳字符串
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);
  }

  /**
   * 确保目录存在
   */
  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 确保默认输出目录存在
   */
  private ensureOutputDirectory(): void {
    this.ensureDirectory(this.defaultOutputDir);
  }

  /**
   * 创建包的README文件
   */
  private async createPackageReadme(
    packageDir: string,
    analysisReport: SiteAnalysisReport,
    exportResults: ExportResult[]
  ): Promise<void> {
    const readmeContent = `# SEO关键词分析报告包

## 报告信息
- **网站**: ${analysisReport.siteUrl}
- **分析页面数**: ${analysisReport.analyzedPages}
- **平均SEO得分**: ${analysisReport.summary.averageScore}
- **生成时间**: ${analysisReport.generatedAt.toLocaleString('zh-CN')}

## 包含文件

${exportResults.map(result => {
  if (result.success && result.filename) {
    const format = path.extname(result.filename).substring(1).toUpperCase();
    return `- **${result.filename}** - ${format}格式报告${result.size ? ` (${(result.size / 1024).toFixed(1)} KB)` : ''}`;
  }
  return '';
}).filter(Boolean).join('\n')}

## 文件说明

- **HTML格式** - 适合在浏览器中查看，包含完整的样式和交互
- **JSON格式** - 适合程序处理和数据分析
- **CSV格式** - 适合在Excel等表格软件中查看和分析
- **Markdown格式** - 适合在文档系统中查看和编辑

## 使用建议

1. 首先查看HTML格式报告，获得整体概览
2. 使用CSV格式进行数据分析和筛选
3. 使用JSON格式进行程序化处理
4. 使用Markdown格式进行文档整理和分享

---
*此报告由SEO关键词检测模块自动生成*
`;

    const readmePath = path.join(packageDir, 'README.md');
    await fs.promises.writeFile(readmePath, readmeContent, 'utf-8');
  }

  /**
   * 获取支持的导出格式
   */
  getSupportedFormats(): ReportFormat[] {
    return Object.values(ReportFormat);
  }

  /**
   * 设置默认输出目录
   */
  setDefaultOutputDir(outputDir: string): void {
    this.defaultOutputDir = outputDir;
    this.ensureOutputDirectory();
  }

  /**
   * 获取默认输出目录
   */
  getDefaultOutputDir(): string {
    return this.defaultOutputDir;
  }

  /**
   * 清理旧报告文件
   * 删除指定天数之前的报告文件
   */
  async cleanupOldReports(daysToKeep: number = 7): Promise<{ deletedCount: number; errors: string[] }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;
    const errors: string[] = [];

    try {
      const files = await fs.promises.readdir(this.defaultOutputDir);
      
      for (const file of files) {
        const filePath = path.join(this.defaultOutputDir, file);
        
        try {
          const stats = await fs.promises.stat(filePath);
          
          if (stats.isFile() && stats.mtime < cutoffDate) {
            await fs.promises.unlink(filePath);
            deletedCount++;
          } else if (stats.isDirectory() && stats.mtime < cutoffDate) {
            // 递归删除旧目录
            await fs.promises.rm(filePath, { recursive: true });
            deletedCount++;
          }
        } catch (error) {
          errors.push(`Failed to process ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to read output directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { deletedCount, errors };
  }
}