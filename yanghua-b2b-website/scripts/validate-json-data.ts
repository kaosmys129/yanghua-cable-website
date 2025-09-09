#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  file: string;
  isValid: boolean;
  errors: string[];
  stats: {
    size: number;
    itemCount?: number;
    structure?: string;
  };
}

class DataValidator {
  private dataDir: string;
  private results: ValidationResult[] = [];

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async validateAllFiles(): Promise<ValidationResult[]> {
    const files = [
      'projects_complete_content.json',
      'merged_news_with_content.json',
      'cleaned_news_data_english.json',
      'cleaned_news_data_spanish.json',
      'yanghuasti_news_formatted.json'
    ];

    for (const file of files) {
      const result = await this.validateFile(file);
      this.results.push(result);
    }

    return this.results;
  }

  private async validateFile(filename: string): Promise<ValidationResult> {
    const filePath = path.join(this.dataDir, filename);
    const result: ValidationResult = {
      file: filename,
      isValid: false,
      errors: [],
      stats: { size: 0 }
    };

    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        result.errors.push('文件不存在');
        return result;
      }

      // 获取文件大小
      const stats = fs.statSync(filePath);
      result.stats.size = stats.size;

      // 读取并解析JSON
      const content = fs.readFileSync(filePath, 'utf8');
      let data;
      
      try {
        data = JSON.parse(content);
      } catch (parseError) {
        result.errors.push(`JSON解析错误: ${parseError}`);
        return result;
      }

      // 根据文件类型进行特定验证
      if (filename === 'projects_complete_content.json') {
        result.stats.structure = 'projects';
        this.validateProjectsData(data, result);
      } else if (filename.includes('news')) {
        result.stats.structure = 'news';
        this.validateNewsData(data, result);
      }

      // 如果没有错误，标记为有效
      if (result.errors.length === 0) {
        result.isValid = true;
      }

    } catch (error) {
      result.errors.push(`文件读取错误: ${error}`);
    }

    return result;
  }

  private validateProjectsData(data: any, result: ValidationResult): void {
    if (!data.projects || !Array.isArray(data.projects)) {
      result.errors.push('缺少projects数组');
      return;
    }

    result.stats.itemCount = data.projects.length;

    // 验证每个项目的必需字段
    data.projects.forEach((project: any, index: number) => {
      const requiredFields = ['title', 'description', 'content', 'created_at', 'metadata'];
      
      requiredFields.forEach(field => {
        if (!project[field]) {
          result.errors.push(`项目 ${index + 1} 缺少字段: ${field}`);
        }
      });

      // 验证metadata结构
      if (project.metadata) {
        const metadataFields = ['client', 'industry', 'location', 'duration'];
        metadataFields.forEach(field => {
          if (!project.metadata[field]) {
            result.errors.push(`项目 ${index + 1} metadata缺少字段: ${field}`);
          }
        });
      }
    });
  }

  private validateNewsData(data: any, result: ValidationResult): void {
    let newsArray;
    
    if (data.news && Array.isArray(data.news)) {
      newsArray = data.news;
    } else if (Array.isArray(data)) {
      newsArray = data;
    } else {
      result.errors.push('无法找到新闻数组');
      return;
    }

    result.stats.itemCount = newsArray.length;

    // 验证每条新闻的必需字段
    newsArray.forEach((news: any, index: number) => {
      const requiredFields = ['title', 'date'];
      
      requiredFields.forEach(field => {
        if (!news[field]) {
          result.errors.push(`新闻 ${index + 1} 缺少字段: ${field}`);
        }
      });

      // 验证日期格式
      if (news.date && !this.isValidDate(news.date)) {
        result.errors.push(`新闻 ${index + 1} 日期格式无效: ${news.date}`);
      }
    });
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  generateReport(): string {
    let report = '\n=== JSON数据完整性检查报告 ===\n\n';
    report += `检查时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

    let totalFiles = this.results.length;
    let validFiles = this.results.filter(r => r.isValid).length;
    let totalItems = this.results.reduce((sum, r) => sum + (r.stats.itemCount || 0), 0);

    report += `文件总数: ${totalFiles}\n`;
    report += `有效文件: ${validFiles}\n`;
    report += `数据项总数: ${totalItems}\n\n`;

    this.results.forEach(result => {
      report += `📁 ${result.file}\n`;
      report += `   状态: ${result.isValid ? '✅ 有效' : '❌ 无效'}\n`;
      report += `   大小: ${(result.stats.size / 1024).toFixed(2)} KB\n`;
      
      if (result.stats.itemCount !== undefined) {
        report += `   数据项: ${result.stats.itemCount}\n`;
      }
      
      if (result.stats.structure) {
        report += `   结构: ${result.stats.structure}\n`;
      }

      if (result.errors.length > 0) {
        report += `   错误:\n`;
        result.errors.forEach(error => {
          report += `     - ${error}\n`;
        });
      }
      
      report += '\n';
    });

    return report;
  }
}

async function main() {
  console.log('🔍 开始JSON数据完整性检查...');
  
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const validator = new DataValidator(dataDir);
  
  await validator.validateAllFiles();
  const report = validator.generateReport();
  
  console.log(report);
  
  // 保存报告到文件
  const reportPath = path.join(process.cwd(), 'data-validation-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`📄 报告已保存到: ${reportPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { DataValidator };