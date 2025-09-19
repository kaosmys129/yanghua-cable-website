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

export class ErrorReportGenerator {
  static async generateHTMLReport(reportData: { reports: ErrorReport[] }) {
    const { reports } = reportData;
    
    const totalErrors = reports.reduce((sum, report) => 
      sum + 
      report.errors.consoleErrors.length + 
      report.errors.networkErrors.length + 
      report.errors.javascriptErrors.length + 
      report.errors.performanceIssues.length
    , 0);

    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>阳华B2B网站 - 错误收集报告</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f5f5f5;
                color: #333;
                line-height: 1.6;
            }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 30px;
                text-align: center;
            }
            .header h1 { font-size: 2.5em; margin-bottom: 10px; }
            .header p { font-size: 1.2em; opacity: 0.9; }
            
            .summary-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .summary-card {
                background: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                text-align: center;
            }
            .summary-card .number {
                font-size: 3em;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .summary-card.errors .number { color: #e74c3c; }
            .summary-card.warnings .number { color: #f39c12; }
            .summary-card.pages .number { color: #3498db; }
            .summary-card.performance .number { color: #9b59b6; }
            
            .report-section {
                background: white;
                margin-bottom: 20px;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .report-section h2 {
                background: #34495e;
                color: white;
                padding: 20px;
                margin: 0;
                cursor: pointer;
                user-select: none;
            }
            .report-section h2:hover { background: #2c3e50; }
            .report-content {
                padding: 20px;
                max-height: 500px;
                overflow-y: auto;
            }
            
            .error-item {
                padding: 15px;
                margin-bottom: 10px;
                border-left: 4px solid #e74c3c;
                background: #fdf2f2;
                border-radius: 0 5px 5px 0;
            }
            .warning-item {
                padding: 15px;
                margin-bottom: 10px;
                border-left: 4px solid #f39c12;
                background: #fdf6e3;
                border-radius: 0 5px 5px 0;
            }
            .success-item {
                padding: 15px;
                margin-bottom: 10px;
                border-left: 4px solid #27ae60;
                background: #f0fff4;
                border-radius: 0 5px 5px 0;
            }
            
            .error-url { font-weight: bold; color: #2c3e50; margin-bottom: 8px; }
            .error-details { font-family: monospace; font-size: 0.9em; }
            .error-stack { 
                color: #666; 
                margin-top: 8px; 
                font-size: 0.8em;
                max-height: 100px;
                overflow-y: auto;
                background: #f8f8f8;
                padding: 8px;
                border-radius: 3px;
            }
            
            .performance-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            .metric-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                text-align: center;
            }
            .metric-value {
                font-size: 1.5em;
                font-weight: bold;
                color: #495057;
            }
            .metric-label {
                color: #6c757d;
                font-size: 0.9em;
                margin-top: 5px;
            }
            
            .collapsible { display: none; }
            .collapsible.active { display: block; }
            
            .timestamp {
                text-align: center;
                color: #666;
                font-size: 0.9em;
                margin-top: 30px;
                padding: 20px;
                background: white;
                border-radius: 10px;
            }
            
            @media (max-width: 768px) {
                .summary-cards { grid-template-columns: 1fr; }
                .container { padding: 10px; }
                .header { padding: 20px; }
                .header h1 { font-size: 2em; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔍 错误收集报告</h1>
                <p>阳华B2B网站自动化测试结果</p>
            </div>
            
            <div class="summary-cards">
                <div class="summary-card errors">
                    <div class="number">${totalErrors}</div>
                    <div>总错误数量</div>
                </div>
                <div class="summary-card pages">
                    <div class="number">${reports.length}</div>
                    <div>测试页面数</div>
                </div>
                <div class="summary-card warnings">
                    <div class="number">${reports.reduce((sum, r) => sum + r.errors.performanceIssues.filter(p => p.severity === 'warning').length, 0)}</div>
                    <div>性能警告</div>
                </div>
                <div class="summary-card performance">
                    <div class="number">${Math.round(reports.reduce((sum, r) => sum + r.pageLoadMetrics.loadComplete, 0) / reports.length)}ms</div>
                    <div>平均加载时间</div>
                </div>
            </div>

            ${this.generateErrorSections(reports)}
            
            <div class="timestamp">
                <p>报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
                <p>测试环境: 本地开发服务器 (http://localhost:3000)</p>
            </div>
        </div>
        
        <script>
            document.querySelectorAll('.report-section h2').forEach(header => {
                header.addEventListener('click', () => {
                    const content = header.nextElementSibling;
                    content.classList.toggle('collapsible');
                    content.classList.toggle('active');
                    
                    if (content.classList.contains('active')) {
                        content.style.display = 'block';
                    } else {
                        content.style.display = 'none';
                    }
                });
            });
            
            // 默认展开第一个有错误的部分
            const firstErrorSection = document.querySelector('.report-section .report-content');
            if (firstErrorSection) {
                firstErrorSection.classList.add('active');
                firstErrorSection.style.display = 'block';
            }
        </script>
    </body>
    </html>`;

    const reportPath = path.join(process.cwd(), 'test-results', 'error-report.html');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, html);
    
    return reportPath;
  }

  private static generateErrorSections(reports: ErrorReport[]): string {
    let sections = '';

    // 控制台错误
    const consoleErrors = reports.filter(r => r.errors.consoleErrors.length > 0);
    if (consoleErrors.length > 0) {
      sections += `
        <div class="report-section">
            <h2>🚨 控制台错误 (${consoleErrors.reduce((sum, r) => sum + r.errors.consoleErrors.length, 0)})</h2>
            <div class="report-content collapsible">
                ${consoleErrors.map(report => `
                    <div class="error-item">
                        <div class="error-url">📄 ${report.url}</div>
                        ${report.errors.consoleErrors.map(error => `
                            <div class="error-details">❌ ${error.text}</div>
                            ${error.location ? `<div class="error-stack">📍 位置: ${error.location}</div>` : ''}
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // 网络错误
    const networkErrors = reports.filter(r => r.errors.networkErrors.length > 0);
    if (networkErrors.length > 0) {
      sections += `
        <div class="report-section">
            <h2>🌐 网络错误 (${networkErrors.reduce((sum, r) => sum + r.errors.networkErrors.length, 0)})</h2>
            <div class="report-content collapsible">
                ${networkErrors.map(report => `
                    <div class="error-item">
                        <div class="error-url">📄 页面: ${report.url}</div>
                        ${report.errors.networkErrors.map(error => `
                            <div class="error-details">
                                ❌ ${error.method} ${error.url}<br>
                                📊 状态: ${error.status} ${error.statusText}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // JavaScript错误
    const jsErrors = reports.filter(r => r.errors.javascriptErrors.length > 0);
    if (jsErrors.length > 0) {
      sections += `
        <div class="report-section">
            <h2>⚡ JavaScript错误 (${jsErrors.reduce((sum, r) => sum + r.errors.javascriptErrors.length, 0)})</h2>
            <div class="report-content collapsible">
                ${jsErrors.map(report => `
                    <div class="error-item">
                        <div class="error-url">📄 ${report.url}</div>
                        ${report.errors.javascriptErrors.map(error => `
                            <div class="error-details">❌ ${error.message}</div>
                            <div class="error-stack">📍 源文件: ${error.source}</div>
                            ${error.stack ? `<div class="error-stack">📚 堆栈:\n${error.stack}</div>` : ''}
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // 性能问题
    const performanceIssues = reports.filter(r => r.errors.performanceIssues.length > 0);
    if (performanceIssues.length > 0) {
      sections += `
        <div class="report-section">
            <h2>⚡ 性能问题 (${performanceIssues.reduce((sum, r) => sum + r.errors.performanceIssues.length, 0)})</h2>
            <div class="report-content collapsible">
                ${performanceIssues.map(report => `
                    <div class="${report.errors.performanceIssues.some(p => p.severity === 'error') ? 'error-item' : 'warning-item'}">
                        <div class="error-url">📄 ${report.url}</div>
                        ${report.errors.performanceIssues.map(issue => `
                            <div class="error-details">
                                ${issue.severity === 'error' ? '🔴' : '🟡'} ${issue.metric}: ${issue.value}ms 
                                (阈值: ${issue.threshold}ms)
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // 页面性能概览
    sections += `
        <div class="report-section">
            <h2>📊 页面性能概览</h2>
            <div class="report-content collapsible active">
                ${reports.map(report => `
                    <div class="success-item">
                        <div class="error-url">📄 ${report.url} (${report.viewport})</div>
                        <div class="performance-metrics">
                            <div class="metric-item">
                                <div class="metric-value">${report.pageLoadMetrics.domContentLoaded}ms</div>
                                <div class="metric-label">DOM加载完成</div>
                            </div>
                            <div class="metric-item">
                                <div class="metric-value">${report.pageLoadMetrics.loadComplete}ms</div>
                                <div class="metric-label">页面加载完成</div>
                            </div>
                            ${report.pageLoadMetrics.firstContentfulPaint ? `
                                <div class="metric-item">
                                    <div class="metric-value">${Math.round(report.pageLoadMetrics.firstContentfulPaint)}ms</div>
                                    <div class="metric-label">首次内容绘制</div>
                                </div>
                            ` : ''}
                            ${report.pageLoadMetrics.largestContentfulPaint ? `
                                <div class="metric-item">
                                    <div class="metric-value">${Math.round(report.pageLoadMetrics.largestContentfulPaint)}ms</div>
                                    <div class="metric-label">最大内容绘制</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;

    return sections;
  }
}