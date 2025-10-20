import { SiteAnalysisReport, PageAnalysisResult, KeywordAnalysis } from './KeywordAnalyzer';

/**
 * 报告格式枚举
 */
export enum ReportFormat {
  JSON = 'json',
  HTML = 'html',
  CSV = 'csv',
  MARKDOWN = 'markdown'
}

/**
 * 报告配置接口
 */
export interface ReportConfig {
  format: ReportFormat;
  includeDetails: boolean;
  includeSuggestions: boolean;
  includeCharts: boolean;
  customTitle?: string;
  customDescription?: string;
}

/**
 * 报告生成器类
 * 负责将分析结果转换为各种格式的报告
 */
export class ReportGenerator {
  private config: ReportConfig;

  constructor(config: Partial<ReportConfig> = {}) {
    this.config = {
      format: ReportFormat.HTML,
      includeDetails: true,
      includeSuggestions: true,
      includeCharts: false,
      ...config
    };
  }

  /**
   * 生成报告
   */
  generateReport(analysisReport: SiteAnalysisReport): string {
    switch (this.config.format) {
      case ReportFormat.JSON:
        return this.generateJSONReport(analysisReport);
      case ReportFormat.HTML:
        return this.generateHTMLReport(analysisReport);
      case ReportFormat.CSV:
        return this.generateCSVReport(analysisReport);
      case ReportFormat.MARKDOWN:
        return this.generateMarkdownReport(analysisReport);
      default:
        throw new Error(`Unsupported report format: ${this.config.format}`);
    }
  }

  /**
   * 生成JSON格式报告
   */
  private generateJSONReport(report: SiteAnalysisReport): string {
    const jsonReport = {
      metadata: {
        title: this.config.customTitle || 'SEO关键词分析报告',
        description: this.config.customDescription || '网站关键词布局分析结果',
        generatedAt: new Date().toISOString(),
        analyzedPages: report.analyzedPages,
        averageScore: report.summary.averageScore
      },
      summary: report.summary,
      ...(this.config.includeDetails && { pageResults: report.pageResults }),
      ...(this.config.includeSuggestions && { recommendations: report.recommendations })
    };

    return JSON.stringify(jsonReport, null, 2);
  }

  /**
   * 检查标题标签中是否找到关键词
   */
  private isHeadingFound(headings: KeywordAnalysis['positions']['headings']): boolean {
    return Object.values(headings).some(heading => heading.found);
  }

  /**
   * 获取标题标签中关键词的总数
   */
  private getHeadingCount(headings: KeywordAnalysis['positions']['headings']): number {
    return Object.values(headings).reduce((total, heading) => total + heading.count, 0);
  }

  /**
   * 生成HTML格式报告
   */
  private generateHTMLReport(report: SiteAnalysisReport): string {
    const title = this.config.customTitle || 'SEO关键词分析报告';
    const description = this.config.customDescription || '网站关键词布局分析结果';

    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #2c3e50; font-size: 28px; margin: 0 0 10px 0; }
        .subtitle { color: #7f8c8d; font-size: 16px; margin: 0; }
        .metadata { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { font-size: 14px; color: #7f8c8d; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section-title { color: #2c3e50; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #3498db; padding-left: 15px; }
        .score { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; color: white; }
        .score-excellent { background: #27ae60; }
        .score-good { background: #f39c12; }
        .score-poor { background: #e74c3c; }
        .keyword-coverage { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
        .keyword-item { background: #f8f9fa; padding: 15px; border-radius: 6px; }
        .coverage-bar { width: 100%; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden; margin-top: 8px; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #e74c3c 0%, #f39c12 50%, #27ae60 100%); }
        .issues-list { list-style: none; padding: 0; }
        .issue-item { background: #fff5f5; border-left: 4px solid #e74c3c; padding: 10px 15px; margin: 8px 0; border-radius: 0 4px 4px 0; }
        .suggestions-list { list-style: none; padding: 0; }
        .suggestion-item { background: #f0fff4; border-left: 4px solid #27ae60; padding: 10px 15px; margin: 8px 0; border-radius: 0 4px 4px 0; }
        .page-results { margin-top: 20px; }
        .page-item { background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 6px; padding: 20px; margin: 15px 0; }
        .page-url { font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .keyword-analysis { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .position-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px; }
        .position-item { text-align: center; padding: 8px; border-radius: 4px; }
        .position-found { background: #d4edda; color: #155724; }
        .position-not-found { background: #f8d7da; color: #721c24; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e1e5e9; }
        th { background: #f8f9fa; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e5e9; text-align: center; color: #7f8c8d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${title}</h1>
            <p class="subtitle">${description}</p>
            <div class="metadata">
                <div class="metric">
                    <div class="metric-value">${report.analyzedPages}</div>
                    <div class="metric-label">分析页面数</div>
                </div>
                <div class="metric">
                    <div class="metric-value ${this.getScoreClass(report.summary.averageScore)}">${report.summary.averageScore}</div>
                    <div class="metric-label">平均SEO得分</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${new Date().toLocaleDateString('zh-CN')}</div>
                    <div class="metric-label">生成日期</div>
                </div>
            </div>
        </div>

        ${this.generateSummarySection(report.summary)}
        
        ${this.config.includeSuggestions ? this.generateRecommendationsSection(report.recommendations) : ''}
        
        ${this.config.includeDetails ? this.generatePageResultsSection(report.pageResults) : ''}

        <div class="footer">
            <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  /**
   * 生成摘要部分HTML
   */
  private generateSummarySection(summary: SiteAnalysisReport['summary']): string {
    return `
        <div class="section">
            <h2 class="section-title">分析摘要</h2>
            
            <h3>关键词覆盖率</h3>
            <div class="keyword-coverage">
                ${summary.keywordCoverage.map(kc => `
                    <div class="keyword-item">
                        <strong>${kc.keyword}</strong>
                        <div class="coverage-bar">
                            <div class="coverage-fill" style="width: ${kc.coverage}%"></div>
                        </div>
                        <div style="margin-top: 5px; font-size: 14px;">${kc.coverage}% 覆盖率</div>
                    </div>
                `).join('')}
            </div>

            <h3>表现最佳页面</h3>
            <ul>
                ${summary.topPerformingPages.map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}
            </ul>

            <h3>需要优化的页面</h3>
            <ul>
                ${summary.poorPerformingPages.map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}
            </ul>

            <h3>常见问题</h3>
            <ul class="issues-list">
                ${summary.commonIssues.map(issue => `
                    <li class="issue-item">
                        <strong>${issue.issue}</strong> (影响 ${issue.frequency} 个页面)
                    </li>
                `).join('')}
            </ul>
        </div>`;
  }

  /**
   * 生成建议部分HTML
   */
  private generateRecommendationsSection(recommendations: string[]): string {
    return `
        <div class="section">
            <h2 class="section-title">优化建议</h2>
            <ul class="suggestions-list">
                ${recommendations.map(rec => `<li class="suggestion-item">${rec}</li>`).join('')}
            </ul>
        </div>`;
  }

  /**
   * 生成页面结果部分HTML
   */
  private generatePageResultsSection(pageResults: PageAnalysisResult[]): string {
    return `
        <div class="section">
            <h2 class="section-title">详细页面分析</h2>
            <div class="page-results">
                ${pageResults.map(result => `
                    <div class="page-item">
                        <div class="page-url">
                            <a href="${result.url}" target="_blank">${result.url}</a>
                            <span class="score ${this.getScoreClass(result.overallScore)}">${result.overallScore}分</span>
                        </div>
                        
                        <h4>关键词分析</h4>
                        ${result.keywordAnalyses.map(analysis => `
                            <div class="keyword-analysis">
                                <strong>${analysis.keyword}</strong> (SEO得分: ${analysis.seoScore})
                                <div class="position-info">
                                    <div class="position-item ${analysis.positions.title.found ? 'position-found' : 'position-not-found'}">
                                        标题: ${analysis.positions.title.found ? '✓' : '✗'}
                                        ${analysis.positions.title.count > 0 ? `(${analysis.positions.title.count}次)` : ''}
                                    </div>
                                    <div class="position-item ${analysis.positions.metaDescription.found ? 'position-found' : 'position-not-found'}">
                                        描述: ${analysis.positions.metaDescription.found ? '✓' : '✗'}
                                        ${analysis.positions.metaDescription.count > 0 ? `(${analysis.positions.metaDescription.count}次)` : ''}
                                    </div>
                                    <div class="position-item ${this.isHeadingFound(analysis.positions.headings) ? 'position-found' : 'position-not-found'}">
                                        标题标签: ${this.isHeadingFound(analysis.positions.headings) ? '✓' : '✗'}
                                        ${this.getHeadingCount(analysis.positions.headings) > 0 ? `(${this.getHeadingCount(analysis.positions.headings)}次)` : ''}
                                    </div>
                                    <div class="position-item ${analysis.positions.bodyText.found ? 'position-found' : 'position-not-found'}">
                                        正文: ${analysis.positions.bodyText.found ? '✓' : '✗'}
                                        ${analysis.positions.bodyText.density > 0 ? `(密度: ${analysis.positions.bodyText.density.toFixed(2)}%)` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                        
                        ${result.issues.length > 0 ? `
                            <h4>发现的问题</h4>
                            <ul class="issues-list">
                                ${result.issues.map(issue => `<li class="issue-item">${issue}</li>`).join('')}
                            </ul>
                        ` : ''}
                        
                        ${result.suggestions.length > 0 ? `
                            <h4>优化建议</h4>
                            <ul class="suggestions-list">
                                ${result.suggestions.map(suggestion => `<li class="suggestion-item">${suggestion}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>`;
  }

  /**
   * 生成CSV格式报告
   */
  private generateCSVReport(report: SiteAnalysisReport): string {
    const headers = [
      'URL',
      '整体得分',
      '关键词',
      '关键词得分',
      '标题中出现',
      '描述中出现',
      '标题标签中出现',
      '正文密度(%)',
      '主要问题',
      '优化建议'
    ];

    const rows: string[][] = [headers];

    report.pageResults.forEach(result => {
      result.keywordAnalyses.forEach(analysis => {
        const row = [
          `"${result.url}"`,
          result.overallScore.toString(),
          `"${analysis.keyword}"`,
          analysis.seoScore.toString(),
          analysis.positions.title.found ? 'Yes' : 'No',
          analysis.positions.metaDescription.found ? 'Yes' : 'No',
          this.isHeadingFound(analysis.positions.headings) ? 'Yes' : 'No',
          analysis.positions.bodyText.density.toFixed(2),
          `"${result.issues.slice(0, 3).join('; ')}"`,
          `"${result.suggestions.slice(0, 3).join('; ')}"`
        ];
        rows.push(row);
      });
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * 生成Markdown格式报告
   */
  private generateMarkdownReport(report: SiteAnalysisReport): string {
    const title = this.config.customTitle || 'SEO关键词分析报告';
    const description = this.config.customDescription || '网站关键词布局分析结果';

    let markdown = `# ${title}\n\n${description}\n\n`;

    // 基本信息
    markdown += `## 基本信息\n\n`;
    markdown += `- **已分析页面**: ${report.analyzedPages}\n`;
    markdown += `- **平均SEO得分**: ${report.summary.averageScore}\n`;
    markdown += `- **生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;

    // 关键词覆盖率
    markdown += `## 关键词覆盖率\n\n`;
    markdown += `| 关键词 | 覆盖率 |\n`;
    markdown += `|--------|--------|\n`;
    report.summary.keywordCoverage.forEach(kc => {
      markdown += `| ${kc.keyword} | ${kc.coverage}% |\n`;
    });
    markdown += `\n`;

    // 常见问题
    if (report.summary.commonIssues.length > 0) {
      markdown += `## 常见问题\n\n`;
      report.summary.commonIssues.forEach(issue => {
        markdown += `- **${issue.issue}** (影响 ${issue.frequency} 个页面)\n`;
      });
      markdown += `\n`;
    }

    // 优化建议
    if (this.config.includeSuggestions && report.recommendations.length > 0) {
      markdown += `## 优化建议\n\n`;
      report.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += `\n`;
    }

    // 详细页面分析
    if (this.config.includeDetails) {
      markdown += `## 详细页面分析\n\n`;
      report.pageResults.forEach(result => {
        markdown += `### ${result.url}\n\n`;
        markdown += `**整体得分**: ${result.overallScore}\n\n`;
        
        if (result.keywordAnalyses.length > 0) {
          markdown += `#### 关键词分析\n\n`;
          markdown += `| 关键词 | 得分 | 标题 | 描述 | 标题标签 | 正文密度 |\n`;
          markdown += `|--------|------|------|------|----------|----------|\n`;
          result.keywordAnalyses.forEach(analysis => {
            markdown += `| ${analysis.keyword} | ${analysis.seoScore} | ${analysis.positions.title.found ? '✓' : '✗'} | ${analysis.positions.metaDescription.found ? '✓' : '✗'} | ${this.isHeadingFound(analysis.positions.headings) ? '✓' : '✗'} | ${analysis.positions.bodyText.density.toFixed(2)}% |\n`;
          });
          markdown += `\n`;
        }

        if (result.issues.length > 0) {
          markdown += `#### 发现的问题\n\n`;
          result.issues.forEach(issue => {
            markdown += `- ${issue}\n`;
          });
          markdown += `\n`;
        }

        if (result.suggestions.length > 0) {
          markdown += `#### 优化建议\n\n`;
          result.suggestions.forEach(suggestion => {
            markdown += `- ${suggestion}\n`;
          });
          markdown += `\n`;
        }
      });
    }

    return markdown;
  }

  /**
   * 获取得分对应的CSS类名
   */
  private getScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  }

  /**
   * 更新报告配置
   */
  updateConfig(config: Partial<ReportConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ReportConfig {
    return { ...this.config };
  }
}