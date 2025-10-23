#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

// 验证配置接口
interface ValidationConfig {
  strapi: {
    url: string;
    token: string;
  };
  wordpress: {
    url: string;
    username: string;
    password: string;
  };
  options: {
    checkContent: boolean;
    checkMedia: boolean;
    checkMetadata: boolean;
    generateReport: boolean;
  };
}

// 验证结果接口
interface ValidationResult {
  totalChecked: number;
  passed: number;
  failed: number;
  warnings: number;
  issues: Array<{
    type: 'error' | 'warning';
    articleId: number;
    field: string;
    message: string;
    strapiValue?: any;
    wordpressValue?: any;
  }>;
}

interface ComparisonReport {
  startTime: Date;
  endTime?: Date;
  strapiArticles: number;
  wordpressArticles: number;
  matchedArticles: number;
  contentValidation: ValidationResult;
  mediaValidation: ValidationResult;
  metadataValidation: ValidationResult;
  summary: {
    overallScore: number;
    recommendations: string[];
  };
}

class MigrationValidator {
  private config: ValidationConfig;
  private report: ComparisonReport;
  private logFile: string;

  constructor(config: ValidationConfig) {
    this.config = config;
    this.report = {
      startTime: new Date(),
      strapiArticles: 0,
      wordpressArticles: 0,
      matchedArticles: 0,
      contentValidation: this.createEmptyValidationResult(),
      mediaValidation: this.createEmptyValidationResult(),
      metadataValidation: this.createEmptyValidationResult(),
      summary: {
        overallScore: 0,
        recommendations: []
      }
    };
    this.logFile = path.join(process.cwd(), `validation-${Date.now()}.log`);
  }

  private createEmptyValidationResult(): ValidationResult {
    return {
      totalChecked: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
  }

  private async log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    console.log(logMessage);
    await fs.appendFile(this.logFile, logMessage + '\n');
  }

  // 获取Strapi文章
  private async fetchStrapiArticles(): Promise<any[]> {
    await this.log('获取Strapi文章数据...');
    
    const articles: any[] = [];
    let page = 1;
    const pageSize = 25;
    
    try {
      while (true) {
        const response = await axios.get(`${this.config.strapi.url}/api/articles`, {
          headers: {
            'Authorization': `Bearer ${this.config.strapi.token}`
          },
          params: {
            'pagination[page]': page,
            'pagination[pageSize]': pageSize,
            'populate': 'deep'
          }
        });

        const data = response.data.data;
        if (!data || data.length === 0) break;

        articles.push(...data);
        page++;
        
        if (data.length < pageSize) break;
      }

      this.report.strapiArticles = articles.length;
      await this.log(`获取到 ${articles.length} 篇Strapi文章`);
      return articles;
      
    } catch (error) {
      await this.log(`获取Strapi文章失败: ${error}`, 'ERROR');
      throw error;
    }
  }

  // 获取WordPress文章
  private async fetchWordPressArticles(): Promise<any[]> {
    await this.log('获取WordPress文章数据...');
    
    const articles: any[] = [];
    let page = 1;
    const perPage = 100;
    
    try {
      while (true) {
        const response = await axios.get(`${this.config.wordpress.url}/wp-json/wp/v2/posts`, {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${this.config.wordpress.username}:${this.config.wordpress.password}`
            ).toString('base64')}`
          },
          params: {
            page: page,
            per_page: perPage,
            _embed: true
          }
        });

        const data = response.data;
        if (!data || data.length === 0) break;

        articles.push(...data);
        page++;
        
        if (data.length < perPage) break;
      }

      this.report.wordpressArticles = articles.length;
      await this.log(`获取到 ${articles.length} 篇WordPress文章`);
      return articles;
      
    } catch (error) {
      await this.log(`获取WordPress文章失败: ${error}`, 'ERROR');
      throw error;
    }
  }

  // 根据Strapi ID匹配WordPress文章
  private findWordPressArticleByStrapi(wordpressArticles: any[], strapiId: number): any | null {
    return wordpressArticles.find(wp => 
      wp.meta?.strapi_id === strapiId || 
      wp.meta?.strapi_id === String(strapiId)
    ) || null;
  }

  // 验证内容一致性
  private validateContent(strapiArticle: any, wordpressArticle: any): ValidationResult {
    const result = this.createEmptyValidationResult();
    result.totalChecked = 1;

    const strapiAttrs = strapiArticle.attributes;
    
    // 验证标题
    if (strapiAttrs.title !== wordpressArticle.title.rendered) {
      result.issues.push({
        type: 'error',
        articleId: strapiArticle.id,
        field: 'title',
        message: '标题不匹配',
        strapiValue: strapiAttrs.title,
        wordpressValue: wordpressArticle.title.rendered
      });
      result.failed++;
    }

    // 验证描述/摘要
    const strapiDescription = strapiAttrs.description || '';
    const wpExcerpt = wordpressArticle.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '';
    
    if (strapiDescription && wpExcerpt && strapiDescription !== wpExcerpt) {
      result.issues.push({
        type: 'warning',
        articleId: strapiArticle.id,
        field: 'description',
        message: '描述/摘要不完全匹配',
        strapiValue: strapiDescription,
        wordpressValue: wpExcerpt
      });
      result.warnings++;
    }

    // 验证slug
    if (strapiAttrs.slug !== wordpressArticle.slug) {
      result.issues.push({
        type: 'error',
        articleId: strapiArticle.id,
        field: 'slug',
        message: 'Slug不匹配',
        strapiValue: strapiAttrs.slug,
        wordpressValue: wordpressArticle.slug
      });
      result.failed++;
    }

    // 验证内容长度
    const strapiContentLength = this.extractContentLength(strapiAttrs.blocks);
    const wpContentLength = wordpressArticle.content?.rendered?.length || 0;
    
    const lengthDiff = Math.abs(strapiContentLength - wpContentLength) / Math.max(strapiContentLength, wpContentLength);
    
    if (lengthDiff > 0.2) { // 如果内容长度差异超过20%
      result.issues.push({
        type: 'warning',
        articleId: strapiArticle.id,
        field: 'content_length',
        message: `内容长度差异较大: ${(lengthDiff * 100).toFixed(1)}%`,
        strapiValue: strapiContentLength,
        wordpressValue: wpContentLength
      });
      result.warnings++;
    }

    if (result.issues.length === 0) {
      result.passed = 1;
    }

    return result;
  }

  // 验证媒体文件
  private validateMedia(strapiArticle: any, wordpressArticle: any): ValidationResult {
    const result = this.createEmptyValidationResult();
    result.totalChecked = 1;

    const strapiAttrs = strapiArticle.attributes;
    
    // 验证特色图片
    const hasStrapiCover = strapiAttrs.cover?.data;
    const hasWpFeaturedMedia = wordpressArticle.featured_media && wordpressArticle.featured_media > 0;
    
    if (hasStrapiCover && !hasWpFeaturedMedia) {
      result.issues.push({
        type: 'error',
        articleId: strapiArticle.id,
        field: 'featured_media',
        message: 'Strapi有特色图片但WordPress没有',
        strapiValue: strapiAttrs.cover.data.attributes.url,
        wordpressValue: null
      });
      result.failed++;
    } else if (!hasStrapiCover && hasWpFeaturedMedia) {
      result.issues.push({
        type: 'warning',
        articleId: strapiArticle.id,
        field: 'featured_media',
        message: 'WordPress有特色图片但Strapi没有',
        strapiValue: null,
        wordpressValue: wordpressArticle.featured_media
      });
      result.warnings++;
    }

    // 验证内容中的图片数量
    const strapiImageCount = this.countImagesInBlocks(strapiAttrs.blocks);
    const wpImageCount = this.countImagesInContent(wordpressArticle.content?.rendered || '');
    
    if (Math.abs(strapiImageCount - wpImageCount) > 0) {
      result.issues.push({
        type: 'warning',
        articleId: strapiArticle.id,
        field: 'content_images',
        message: '内容中图片数量不匹配',
        strapiValue: strapiImageCount,
        wordpressValue: wpImageCount
      });
      result.warnings++;
    }

    if (result.issues.length === 0) {
      result.passed = 1;
    }

    return result;
  }

  // 验证元数据
  private validateMetadata(strapiArticle: any, wordpressArticle: any): ValidationResult {
    const result = this.createEmptyValidationResult();
    result.totalChecked = 1;

    const strapiAttrs = strapiArticle.attributes;
    
    // 验证发布日期
    const strapiDate = new Date(strapiAttrs.publishedAt || strapiAttrs.createdAt);
    const wpDate = new Date(wordpressArticle.date);
    
    const dateDiff = Math.abs(strapiDate.getTime() - wpDate.getTime()) / (1000 * 60 * 60 * 24); // 天数差异
    
    if (dateDiff > 1) { // 如果日期差异超过1天
      result.issues.push({
        type: 'warning',
        articleId: strapiArticle.id,
        field: 'publish_date',
        message: `发布日期差异: ${dateDiff.toFixed(1)}天`,
        strapiValue: strapiDate.toISOString(),
        wordpressValue: wpDate.toISOString()
      });
      result.warnings++;
    }

    // 验证语言设置
    const strapiLocale = strapiAttrs.locale || 'zh-CN';
    const wpLocale = wordpressArticle.meta?.locale;
    
    if (wpLocale && strapiLocale !== wpLocale) {
      result.issues.push({
        type: 'error',
        articleId: strapiArticle.id,
        field: 'locale',
        message: '语言设置不匹配',
        strapiValue: strapiLocale,
        wordpressValue: wpLocale
      });
      result.failed++;
    }

    // 验证Strapi ID是否正确保存
    const savedStrapiId = wordpressArticle.meta?.strapi_id;
    if (!savedStrapiId || (Number(savedStrapiId) !== strapiArticle.id)) {
      result.issues.push({
        type: 'error',
        articleId: strapiArticle.id,
        field: 'strapi_id',
        message: 'Strapi ID未正确保存',
        strapiValue: strapiArticle.id,
        wordpressValue: savedStrapiId
      });
      result.failed++;
    }

    if (result.issues.length === 0) {
      result.passed = 1;
    }

    return result;
  }

  // 辅助方法：提取内容长度
  private extractContentLength(blocks: any[]): number {
    if (!blocks) return 0;
    
    let totalLength = 0;
    for (const block of blocks) {
      if (block.__component === 'shared.rich-text' && block.body) {
        totalLength += block.body.length;
      }
    }
    return totalLength;
  }

  // 辅助方法：统计blocks中的图片数量
  private countImagesInBlocks(blocks: any[]): number {
    if (!blocks) return 0;
    
    return blocks.filter(block => 
      block.__component === 'shared.media' && block.file?.data
    ).length;
  }

  // 辅助方法：统计HTML内容中的图片数量
  private countImagesInContent(content: string): number {
    const imgMatches = content.match(/<img[^>]*>/g);
    return imgMatches ? imgMatches.length : 0;
  }

  // 合并验证结果
  private mergeValidationResults(target: ValidationResult, source: ValidationResult) {
    target.totalChecked += source.totalChecked;
    target.passed += source.passed;
    target.failed += source.failed;
    target.warnings += source.warnings;
    target.issues.push(...source.issues);
  }

  // 执行验证
  async validate(): Promise<ComparisonReport> {
    await this.log('开始验证迁移数据...');

    try {
      // 获取数据
      const [strapiArticles, wordpressArticles] = await Promise.all([
        this.fetchStrapiArticles(),
        this.fetchWordPressArticles()
      ]);

      // 匹配和验证文章
      for (const strapiArticle of strapiArticles) {
        const wpArticle = this.findWordPressArticleByStrapi(wordpressArticles, strapiArticle.id);
        
        if (!wpArticle) {
          this.report.contentValidation.issues.push({
            type: 'error',
            articleId: strapiArticle.id,
            field: 'existence',
            message: '在WordPress中未找到对应文章',
            strapiValue: strapiArticle.attributes.title,
            wordpressValue: null
          });
          this.report.contentValidation.failed++;
          continue;
        }

        this.report.matchedArticles++;

        // 内容验证
        if (this.config.options.checkContent) {
          const contentResult = this.validateContent(strapiArticle, wpArticle);
          this.mergeValidationResults(this.report.contentValidation, contentResult);
        }

        // 媒体验证
        if (this.config.options.checkMedia) {
          const mediaResult = this.validateMedia(strapiArticle, wpArticle);
          this.mergeValidationResults(this.report.mediaValidation, mediaResult);
        }

        // 元数据验证
        if (this.config.options.checkMetadata) {
          const metadataResult = this.validateMetadata(strapiArticle, wpArticle);
          this.mergeValidationResults(this.report.metadataValidation, metadataResult);
        }
      }

      // 检查WordPress中是否有多余的文章
      const extraWpArticles = wordpressArticles.filter(wp => 
        !wp.meta?.strapi_id || !strapiArticles.find(s => s.id === Number(wp.meta.strapi_id))
      );

      if (extraWpArticles.length > 0) {
        await this.log(`发现 ${extraWpArticles.length} 篇WordPress文章没有对应的Strapi源`, 'WARN');
      }

      this.report.endTime = new Date();
      this.calculateSummary();

      if (this.config.options.generateReport) {
        await this.generateDetailedReport();
      }

      await this.log('验证完成');
      return this.report;

    } catch (error) {
      await this.log(`验证过程中发生错误: ${error}`, 'ERROR');
      throw error;
    }
  }

  // 计算总结
  private calculateSummary() {
    const totalValidations = this.report.contentValidation.totalChecked + 
                           this.report.mediaValidation.totalChecked + 
                           this.report.metadataValidation.totalChecked;
    
    const totalPassed = this.report.contentValidation.passed + 
                       this.report.mediaValidation.passed + 
                       this.report.metadataValidation.passed;

    this.report.summary.overallScore = totalValidations > 0 ? (totalPassed / totalValidations) * 100 : 0;

    // 生成建议
    const recommendations: string[] = [];
    
    if (this.report.contentValidation.failed > 0) {
      recommendations.push('修复内容不匹配的问题，特别是标题和slug');
    }
    
    if (this.report.mediaValidation.failed > 0) {
      recommendations.push('检查媒体文件迁移，确保特色图片正确设置');
    }
    
    if (this.report.metadataValidation.failed > 0) {
      recommendations.push('验证元数据设置，确保Strapi ID和语言设置正确');
    }
    
    if (this.report.strapiArticles !== this.report.matchedArticles) {
      recommendations.push('检查未匹配的文章，可能需要重新迁移');
    }

    if (recommendations.length === 0) {
      recommendations.push('迁移质量良好，建议进行最终的功能测试');
    }

    this.report.summary.recommendations = recommendations;
  }

  // 生成详细报告
  private async generateDetailedReport() {
    const duration = this.report.endTime 
      ? (this.report.endTime.getTime() - this.report.startTime.getTime()) / 1000
      : 0;

    const reportContent = `
# 迁移验证报告

## 验证概览
- 验证时间: ${this.report.startTime.toISOString()} - ${this.report.endTime?.toISOString()}
- 总耗时: ${duration}秒
- Strapi文章数: ${this.report.strapiArticles}
- WordPress文章数: ${this.report.wordpressArticles}
- 匹配文章数: ${this.report.matchedArticles}
- 总体评分: ${this.report.summary.overallScore.toFixed(2)}%

## 内容验证结果
- 检查数量: ${this.report.contentValidation.totalChecked}
- 通过: ${this.report.contentValidation.passed}
- 失败: ${this.report.contentValidation.failed}
- 警告: ${this.report.contentValidation.warnings}

## 媒体验证结果
- 检查数量: ${this.report.mediaValidation.totalChecked}
- 通过: ${this.report.mediaValidation.passed}
- 失败: ${this.report.mediaValidation.failed}
- 警告: ${this.report.mediaValidation.warnings}

## 元数据验证结果
- 检查数量: ${this.report.metadataValidation.totalChecked}
- 通过: ${this.report.metadataValidation.passed}
- 失败: ${this.report.metadataValidation.failed}
- 警告: ${this.report.metadataValidation.warnings}

## 问题详情

### 内容问题
${this.report.contentValidation.issues.map(issue => 
  `- [${issue.type.toUpperCase()}] 文章ID ${issue.articleId} - ${issue.field}: ${issue.message}`
).join('\n')}

### 媒体问题
${this.report.mediaValidation.issues.map(issue => 
  `- [${issue.type.toUpperCase()}] 文章ID ${issue.articleId} - ${issue.field}: ${issue.message}`
).join('\n')}

### 元数据问题
${this.report.metadataValidation.issues.map(issue => 
  `- [${issue.type.toUpperCase()}] 文章ID ${issue.articleId} - ${issue.field}: ${issue.message}`
).join('\n')}

## 建议
${this.report.summary.recommendations.map(rec => `- ${rec}`).join('\n')}
`;

    const reportPath = path.join(process.cwd(), `validation-report-${Date.now()}.md`);
    await fs.writeFile(reportPath, reportContent);
    await this.log(`详细验证报告已生成: ${reportPath}`);
  }
}

// 默认配置
const defaultConfig: ValidationConfig = {
  strapi: {
    url: process.env.STRAPI_URL || 'https://fruitful-presence-02d7be759c.strapiapp.com',
    token: process.env.STRAPI_API_TOKEN || ''
  },
  wordpress: {
    url: process.env.WORDPRESS_URL || 'http://localhost:8080',
    username: process.env.WORDPRESS_USERNAME || 'admin',
    password: process.env.WORDPRESS_PASSWORD || 'password'
  },
  options: {
    checkContent: true,
    checkMedia: true,
    checkMetadata: true,
    generateReport: true
  }
};

// 主函数
async function main() {
  const validator = new MigrationValidator(defaultConfig);
  
  try {
    const report = await validator.validate();
    
    console.log('\n✅ 验证完成!');
    console.log(`总体评分: ${report.summary.overallScore.toFixed(2)}%`);
    console.log(`匹配文章: ${report.matchedArticles}/${report.strapiArticles}`);
    
    const totalIssues = report.contentValidation.failed + report.mediaValidation.failed + report.metadataValidation.failed;
    const totalWarnings = report.contentValidation.warnings + report.mediaValidation.warnings + report.metadataValidation.warnings;
    
    if (totalIssues > 0) {
      console.log(`⚠️  发现 ${totalIssues} 个错误和 ${totalWarnings} 个警告`);
    }
    
    console.log('\n建议:');
    report.summary.recommendations.forEach(rec => console.log(`- ${rec}`));
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MigrationValidator, type ValidationConfig, type ComparisonReport };