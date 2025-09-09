import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: Array<{
    id: string;
    field: string;
    expected: any;
    actual: any;
    message: string;
  }>;
  warnings: string[];
}

interface FieldMappingValidation {
  sourceField: string;
  targetField: string;
  dataType: string;
  required: boolean;
  validation: (value: any) => boolean;
}

class WordPressMappingValidator {
  private wpBaseUrl: string;
  private wpUsername: string;
  private wpPassword: string;
  private dataDir: string;
  private reportPath: string;

  constructor(
    wpBaseUrl: string = 'http://localhost:8080',
    wpUsername: string = 'admin',
    wpPassword: string = 'password',
    dataDir: string = '../backup'
  ) {
    this.wpBaseUrl = wpBaseUrl;
    this.wpUsername = wpUsername;
    this.wpPassword = wpPassword;
    this.dataDir = path.resolve(__dirname, dataDir);
    this.reportPath = path.resolve(__dirname, '../reports/wordpress-mapping-validation.json');
  }

  private async fetchWordPressData(endpoint: string): Promise<any[]> {
    try {
      const url = `${this.wpBaseUrl}/wp-json/wp/v2${endpoint}`;
      console.log(`获取WordPress数据: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.wpUsername}:${this.wpPassword}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        console.error(`HTTP ${response.status}: ${response.statusText}`);
        const text = await response.text();
        console.error(`响应内容: ${text.substring(0, 200)}...`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`获取WordPress数据失败: ${error}`);
      return [];
    }
  }

  private loadOriginalData(fileName: string): any[] {
    const filePath = path.join(this.dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`原始数据文件不存在: ${fileName}`);
      return [];
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.projects || data.news || data.posts || [];
  }

  private validateProjectMapping(originalProjects: any[], wordpressProjects: any[]): ValidationResult {
    const result: ValidationResult = {
      totalRecords: originalProjects.length,
      validRecords: 0,
      invalidRecords: 0,
      errors: [],
      warnings: []
    };

    const fieldMappings: FieldMappingValidation[] = [
      {
        sourceField: 'title',
        targetField: 'title.rendered',
        dataType: 'string',
        required: true,
        validation: (value) => typeof value === 'string' && value.length > 0
      },
      {
        sourceField: 'client',
        targetField: 'meta.client',
        dataType: 'string',
        required: true,
        validation: (value) => typeof value === 'string' && value.length > 0
      },
      {
        sourceField: 'industry',
        targetField: 'categories[0].name',
        dataType: 'string',
        required: true,
        validation: (value) => typeof value === 'string' && value.length > 0
      },
      {
        sourceField: 'location',
        targetField: 'meta.location',
        dataType: 'string',
        required: true,
        validation: (value) => typeof value === 'string'
      },
      {
        sourceField: 'completionDate',
        targetField: 'meta.completion_date',
        dataType: 'date',
        required: true,
        validation: (value) => typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value)
      },
      {
        sourceField: 'projectScale',
        targetField: 'meta.project_scale',
        dataType: 'string',
        required: false,
        validation: (value) => typeof value === 'string'
      },
      {
        sourceField: 'challenge',
        targetField: 'content.rendered',
        dataType: 'string',
        required: false,
        validation: (value) => typeof value === 'string'
      },
      {
        sourceField: 'solution',
        targetField: 'content.rendered',
        dataType: 'string',
        required: false,
        validation: (value) => typeof value === 'string'
      }
    ];

    // 创建项目映射字典
    const wpProjectMap = new Map<string, any>();
    wordpressProjects.forEach(wpProject => {
      const title = wpProject.title?.rendered || '';
      wpProjectMap.set(title.toLowerCase(), wpProject);
    });

    originalProjects.forEach(originalProject => {
      const title = originalProject.title || '';
      const wpProject = wpProjectMap.get(title.toLowerCase());

      if (!wpProject) {
        result.invalidRecords++;
        result.errors.push({
          id: originalProject.id || title,
          field: 'title',
          expected: title,
          actual: null,
          message: 'WordPress中找不到对应的项目'
        });
        return;
      }

      let isValid = true;

      fieldMappings.forEach(mapping => {
        const originalValue = this.getNestedValue(originalProject, mapping.sourceField);
        const wpValue = this.getNestedValue(wpProject, mapping.targetField);

        if (mapping.required && (!originalValue || !mapping.validation(originalValue))) {
          result.warnings.push(`必填字段缺失: ${mapping.sourceField}`);
        }

        if (!this.valuesMatch(originalValue, wpValue)) {
          isValid = false;
          result.errors.push({
            id: originalProject.id || title,
            field: mapping.sourceField,
            expected: originalValue,
            actual: wpValue,
            message: `字段值不匹配: ${mapping.sourceField} -> ${mapping.targetField}`
          });
        }
      });

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    });

    return result;
  }

  private validateNewsMapping(originalNews: any[], wordpressNews: any[]): ValidationResult {
    const result: ValidationResult = {
      totalRecords: originalNews.length,
      validRecords: 0,
      invalidRecords: 0,
      errors: [],
      warnings: []
    };

    const fieldMappings: FieldMappingValidation[] = [
      {
        sourceField: 'title',
        targetField: 'title.rendered',
        dataType: 'string',
        required: true,
        validation: (value) => typeof value === 'string' && value.length > 0
      },
      {
        sourceField: 'content',
        targetField: 'content.rendered',
        dataType: 'string',
        required: true,
        validation: (value) => typeof value === 'string'
      },
      {
        sourceField: 'excerpt',
        targetField: 'excerpt.rendered',
        dataType: 'string',
        required: false,
        validation: (value) => typeof value === 'string'
      },
      {
        sourceField: 'date',
        targetField: 'date',
        dataType: 'date',
        required: true,
        validation: (value) => typeof value === 'string'
      },
      {
        sourceField: 'category',
        targetField: 'categories[0].name',
        dataType: 'string',
        required: true,
        validation: (value) => typeof value === 'string'
      },
      {
        sourceField: 'author',
        targetField: 'meta.author',
        dataType: 'string',
        required: false,
        validation: (value) => typeof value === 'string'
      }
    ];

    // 创建新闻映射字典
    const wpNewsMap = new Map<string, any>();
    wordpressNews.forEach(wpNews => {
      const title = wpNews.title?.rendered || '';
      wpNewsMap.set(title.toLowerCase(), wpNews);
    });

    originalNews.forEach(originalNewsItem => {
      const title = originalNewsItem.title || '';
      const wpNews = wpNewsMap.get(title.toLowerCase());

      if (!wpNews) {
        result.invalidRecords++;
        result.errors.push({
          id: originalNewsItem.id || title,
          field: 'title',
          expected: title,
          actual: null,
          message: 'WordPress中找不到对应的新闻'
        });
        return;
      }

      let isValid = true;

      fieldMappings.forEach(mapping => {
        const originalValue = this.getNestedValue(originalNewsItem, mapping.sourceField);
        const wpValue = this.getNestedValue(wpNews, mapping.targetField);

        if (mapping.required && (!originalValue || !mapping.validation(originalValue))) {
          result.warnings.push(`必填字段缺失: ${mapping.sourceField}`);
        }

        if (!this.valuesMatch(originalValue, wpValue)) {
          isValid = false;
          result.errors.push({
            id: originalNewsItem.id || title,
            field: mapping.sourceField,
            expected: originalValue,
            actual: wpValue,
            message: `字段值不匹配: ${mapping.sourceField} -> ${mapping.targetField}`
          });
        }
      });

      if (isValid) {
        result.validRecords++;
      } else {
        result.invalidRecords++;
      }
    });

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (key.includes('[')) {
        const [arrayKey, index] = key.split(/\[|\]/).filter(Boolean);
        return current?.[arrayKey]?.[parseInt(index)];
      }
      return current?.[key];
    }, obj);
  }

  private valuesMatch(original: any, wordpress: any): boolean {
    if (original === null || original === undefined) {
      return wordpress === null || wordpress === undefined || wordpress === '';
    }

    const originalStr = String(original).trim();
    const wordpressStr = String(wordpress).trim();

    // 处理HTML标签
    const cleanOriginal = originalStr.replace(/<[^>]*>/g, '').trim();
    const cleanWordPress = wordpressStr.replace(/<[^>]*>/g, '').trim();

    return cleanOriginal === cleanWordPress;
  }

  private generateReport(results: {
    projects: ValidationResult;
    news: ValidationResult;
  }): string {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        projects: {
          total: results.projects.totalRecords || 0,
          valid: results.projects.validRecords || 0,
          invalid: results.projects.invalidRecords || 0,
          successRate: results.projects.totalRecords > 0 
            ? Number((results.projects.validRecords / results.projects.totalRecords * 100).toFixed(2))
            : 0
        },
        news: {
          total: results.news.totalRecords || 0,
          valid: results.news.validRecords || 0,
          invalid: results.news.invalidRecords || 0,
          successRate: results.news.totalRecords > 0 
            ? Number((results.news.validRecords / results.news.totalRecords * 100).toFixed(2))
            : 0
        }
      },
      details: results,
      recommendations: this.generateRecommendations(results)
    };

    return JSON.stringify(report, null, 2);
  }

  private generateRecommendations(results: {
    projects: ValidationResult;
    news: ValidationResult;
  }): string[] {
    const recommendations: string[] = [];

    if (results.projects.invalidRecords > 0) {
      recommendations.push(`修复 ${results.projects.invalidRecords} 个项目的字段映射问题`);
    }

    if (results.news.invalidRecords > 0) {
      recommendations.push(`修复 ${results.news.invalidRecords} 条新闻的字段映射问题`);
    }

    if (results.projects.warnings.length > 0) {
      recommendations.push(`处理 ${results.projects.warnings.length} 个项目的警告信息`);
    }

    if (results.news.warnings.length > 0) {
      recommendations.push(`处理 ${results.news.warnings.length} 条新闻的警告信息`);
    }

    recommendations.push('定期验证数据一致性');
    recommendations.push('建立自动化数据验证流程');

    return recommendations;
  }

  async runValidation(): Promise<void> {
    console.log('🔍 开始验证WordPress数据结构映射...');

    try {
      // 获取WordPress数据
      const wordpressProjects = await this.fetchWordPressData('/posts?categories=2&per_page=100'); // 项目分类ID=2
      const wordpressNews = await this.fetchWordPressData('/posts?per_page=100');

      // 获取原始数据
      const originalProjects = this.loadOriginalData('projects_complete_content.json');
      const originalNews = this.loadOriginalData('merged_news_with_content.json');

      console.log(`找到 ${originalProjects.length} 个原始项目, ${wordpressProjects.length} 个WordPress项目`);
      console.log(`找到 ${originalNews.length} 条原始新闻, ${wordpressNews.length} 条WordPress新闻`);

      // 验证映射
      const projectValidation = this.validateProjectMapping(originalProjects, wordpressProjects);
      const newsValidation = this.validateNewsMapping(originalNews, wordpressNews);

      const results = {
        projects: projectValidation,
        news: newsValidation
      };

      // 生成报告
      const report = this.generateReport(results);
      
      // 保存报告
      fs.writeFileSync(this.reportPath, report);

      // 计算成功率
      const projectsValid = results.projects.validRecords || 0;
      const projectsTotal = results.projects.totalRecords || 0;
      const newsValid = results.news.validRecords || 0;
      const newsTotal = results.news.totalRecords || 0;

      const projectSuccessRate = projectsTotal > 0 
        ? (projectsValid / projectsTotal * 100).toFixed(2)
        : "0";
      const newsSuccessRate = newsTotal > 0 
        ? (newsValid / newsTotal * 100).toFixed(2)
        : "0";

      // 输出结果
      console.log('\n=== 数据结构映射验证结果 ===');
      console.log(`项目数据: ${projectsValid}/${projectsTotal} 有效 (${projectSuccessRate}%)`);
      console.log(`新闻数据: ${newsValid}/${newsTotal} 有效 (${newsSuccessRate}%)`);
      console.log(`\n详细报告已保存到: ${this.reportPath}`);

      const projectErrors = results.projects.errors || [];
      const newsErrors = results.news.errors || [];
      if (projectErrors.length > 0 || newsErrors.length > 0) {
        console.log('\n⚠️  发现映射问题，请查看详细报告');
      } else {
        console.log('\n✅ 所有字段映射验证通过！');
      }

    } catch (error) {
      console.error('验证过程发生错误:', error);
    }
  }
}

// 运行验证
async function main() {
  const validator = new WordPressMappingValidator();
  await validator.runValidation();
}

if (require.main === module) {
  main().catch(console.error);
}

export { WordPressMappingValidator };
export type { ValidationResult };