#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// 配置接口
interface MigrationConfig {
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
    batchSize: number;
    downloadImages: boolean;
    validateData: boolean;
    dryRun: boolean;
  };
}

// 数据类型接口
interface StrapiArticle {
  id: number;
  attributes: {
    title: string;
    description: string;
    slug: string;
    locale: string;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
    cover?: {
      data?: {
        id: number;
        attributes: {
          url: string;
          name: string;
          alternativeText?: string;
        };
      };
    };
    blocks?: Array<{
      __component: string;
      [key: string]: any;
    }>;
    author?: {
      data?: {
        id: number;
        attributes: {
          name: string;
          email: string;
        };
      };
    };
    category?: {
      data?: {
        id: number;
        attributes: {
          name: string;
          slug: string;
        };
      };
    };
  };
}

interface WordPressPost {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: 'publish' | 'draft';
  date: string;
  author: number;
  categories: number[];
  featured_media?: number;
  meta: {
    locale: string;
    strapi_id: number;
  };
}

interface MigrationReport {
  startTime: Date;
  endTime?: Date;
  totalArticles: number;
  migratedArticles: number;
  failedArticles: number;
  errors: Array<{
    articleId: number;
    error: string;
    timestamp: Date;
  }>;
  mediaFiles: {
    total: number;
    migrated: number;
    failed: number;
  };
}

class StrapiToWordPressMigrator {
  private config: MigrationConfig;
  private report: MigrationReport;
  private logFile: string;
  private tempDir: string;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.report = {
      startTime: new Date(),
      totalArticles: 0,
      migratedArticles: 0,
      failedArticles: 0,
      errors: [],
      mediaFiles: {
        total: 0,
        migrated: 0,
        failed: 0
      }
    };
    this.logFile = path.join(process.cwd(), `migration-${Date.now()}.log`);
    this.tempDir = path.join(process.cwd(), 'temp-migration');
  }

  private async log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    console.log(logMessage);
    await fs.appendFile(this.logFile, logMessage + '\n');
  }

  private async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  private async cleanup() {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      await this.log(`清理临时目录失败: ${error}`, 'WARN');
    }
  }

  // 从Strapi获取所有文章
  private async fetchStrapiArticles(): Promise<StrapiArticle[]> {
    await this.log('开始从Strapi获取文章数据...');
    
    const articles: StrapiArticle[] = [];
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
        await this.log(`获取第 ${page} 页，${data.length} 篇文章`);
        
        page++;
        
        // 检查是否还有更多页面
        if (data.length < pageSize) break;
      }

      this.report.totalArticles = articles.length;
      await this.log(`总共获取到 ${articles.length} 篇文章`);
      return articles;
      
    } catch (error) {
      await this.log(`获取Strapi文章失败: ${error}`, 'ERROR');
      throw error;
    }
  }

  // 下载并上传媒体文件到WordPress
  private async migrateMediaFile(mediaUrl: string, fileName: string): Promise<number | null> {
    if (!this.config.options.downloadImages) {
      return null;
    }

    try {
      // 下载文件
      const tempFilePath = path.join(this.tempDir, fileName);
      const response = await axios.get(mediaUrl, {
        responseType: 'stream',
        timeout: 30000
      });

      await pipeline(response.data, createWriteStream(tempFilePath));
      await this.log(`下载媒体文件: ${fileName}`);

      // 上传到WordPress
      const formData = new FormData();
      formData.append('file', await fs.readFile(tempFilePath), fileName);

      const uploadResponse = await axios.post(
        `${this.config.wordpress.url}/wp-json/wp/v2/media`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Basic ${Buffer.from(
              `${this.config.wordpress.username}:${this.config.wordpress.password}`
            ).toString('base64')}`
          }
        }
      );

      this.report.mediaFiles.migrated++;
      await this.log(`上传媒体文件成功: ${fileName}, ID: ${uploadResponse.data.id}`);
      
      // 清理临时文件
      await fs.unlink(tempFilePath);
      
      return uploadResponse.data.id;
      
    } catch (error) {
      this.report.mediaFiles.failed++;
      await this.log(`媒体文件迁移失败 ${fileName}: ${error}`, 'ERROR');
      return null;
    }
  }

  // 转换Strapi文章为WordPress格式
  private async convertArticleToWordPress(article: StrapiArticle): Promise<WordPressPost> {
    const attrs = article.attributes;
    
    // 处理内容块
    let content = '';
    if (attrs.blocks) {
      for (const block of attrs.blocks) {
        if (block.__component === 'shared.rich-text') {
          content += block.body || '';
        } else if (block.__component === 'shared.media' && block.file?.data) {
          const mediaUrl = block.file.data.attributes.url;
          if (mediaUrl.startsWith('/')) {
            content += `<img src="${this.config.strapi.url}${mediaUrl}" alt="${block.file.data.attributes.alternativeText || ''}" />`;
          } else {
            content += `<img src="${mediaUrl}" alt="${block.file.data.attributes.alternativeText || ''}" />`;
          }
        }
      }
    }

    // 处理特色图片
    let featuredMediaId: number | undefined;
    if (attrs.cover?.data) {
      this.report.mediaFiles.total++;
      const coverUrl = attrs.cover.data.attributes.url;
      const fullCoverUrl = coverUrl.startsWith('/') 
        ? `${this.config.strapi.url}${coverUrl}`
        : coverUrl;
      
      featuredMediaId = await this.migrateMediaFile(
        fullCoverUrl,
        attrs.cover.data.attributes.name
      ) || undefined;
    }

    return {
      title: attrs.title,
      content: content,
      excerpt: attrs.description || '',
      slug: attrs.slug,
      status: 'publish',
      date: attrs.publishedAt || attrs.createdAt,
      author: 1, // 默认管理员用户
      categories: [], // 稍后处理分类
      featured_media: featuredMediaId,
      meta: {
        locale: attrs.locale,
        strapi_id: article.id
      }
    };
  }

  // 创建WordPress文章
  private async createWordPressPost(post: WordPressPost): Promise<boolean> {
    if (this.config.options.dryRun) {
      await this.log(`[DRY RUN] 将创建文章: ${post.title}`);
      return true;
    }

    try {
      const response = await axios.post(
        `${this.config.wordpress.url}/wp-json/wp/v2/posts`,
        post,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(
              `${this.config.wordpress.username}:${this.config.wordpress.password}`
            ).toString('base64')}`
          }
        }
      );

      await this.log(`创建WordPress文章成功: ${post.title}, ID: ${response.data.id}`);
      return true;
      
    } catch (error) {
      await this.log(`创建WordPress文章失败 ${post.title}: ${error}`, 'ERROR');
      return false;
    }
  }

  // 执行迁移
  async migrate(): Promise<MigrationReport> {
    await this.log('开始Strapi到WordPress数据迁移...');
    await this.ensureTempDir();

    try {
      // 1. 获取Strapi文章
      const strapiArticles = await this.fetchStrapiArticles();

      // 2. 批量处理文章
      const batchSize = this.config.options.batchSize;
      for (let i = 0; i < strapiArticles.length; i += batchSize) {
        const batch = strapiArticles.slice(i, i + batchSize);
        await this.log(`处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(strapiArticles.length / batchSize)}`);

        for (const article of batch) {
          try {
            // 转换文章格式
            const wordpressPost = await this.convertArticleToWordPress(article);
            
            // 创建WordPress文章
            const success = await this.createWordPressPost(wordpressPost);
            
            if (success) {
              this.report.migratedArticles++;
            } else {
              this.report.failedArticles++;
              this.report.errors.push({
                articleId: article.id,
                error: '创建WordPress文章失败',
                timestamp: new Date()
              });
            }
            
          } catch (error) {
            this.report.failedArticles++;
            this.report.errors.push({
              articleId: article.id,
              error: String(error),
              timestamp: new Date()
            });
            await this.log(`处理文章失败 ID:${article.id}: ${error}`, 'ERROR');
          }
        }

        // 批次间暂停
        if (i + batchSize < strapiArticles.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.report.endTime = new Date();
      await this.generateReport();
      
    } catch (error) {
      await this.log(`迁移过程中发生错误: ${error}`, 'ERROR');
      throw error;
    } finally {
      await this.cleanup();
    }

    return this.report;
  }

  // 生成迁移报告
  private async generateReport() {
    const duration = this.report.endTime 
      ? (this.report.endTime.getTime() - this.report.startTime.getTime()) / 1000
      : 0;

    const reportContent = `
# Strapi到WordPress迁移报告

## 迁移概览
- 开始时间: ${this.report.startTime.toISOString()}
- 结束时间: ${this.report.endTime?.toISOString() || '进行中'}
- 总耗时: ${duration}秒
- 总文章数: ${this.report.totalArticles}
- 成功迁移: ${this.report.migratedArticles}
- 失败数量: ${this.report.failedArticles}
- 成功率: ${((this.report.migratedArticles / this.report.totalArticles) * 100).toFixed(2)}%

## 媒体文件迁移
- 总文件数: ${this.report.mediaFiles.total}
- 成功迁移: ${this.report.mediaFiles.migrated}
- 失败数量: ${this.report.mediaFiles.failed}

## 错误详情
${this.report.errors.map(error => 
  `- 文章ID ${error.articleId}: ${error.error} (${error.timestamp.toISOString()})`
).join('\n')}

## 配置信息
- 批次大小: ${this.config.options.batchSize}
- 下载图片: ${this.config.options.downloadImages}
- 数据验证: ${this.config.options.validateData}
- 试运行模式: ${this.config.options.dryRun}
`;

    const reportPath = path.join(process.cwd(), `migration-report-${Date.now()}.md`);
    await fs.writeFile(reportPath, reportContent);
    await this.log(`迁移报告已生成: ${reportPath}`);
  }
}

// 默认配置
const defaultConfig: MigrationConfig = {
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
    batchSize: 10,
    downloadImages: true,
    validateData: true,
    dryRun: false
  }
};

// 主函数
async function main() {
  const migrator = new StrapiToWordPressMigrator(defaultConfig);
  
  try {
    const report = await migrator.migrate();
    console.log('\n✅ 迁移完成!');
    console.log(`成功迁移: ${report.migratedArticles}/${report.totalArticles} 篇文章`);
    console.log(`媒体文件: ${report.mediaFiles.migrated}/${report.mediaFiles.total} 个文件`);
    
    if (report.failedArticles > 0) {
      console.log(`⚠️  ${report.failedArticles} 篇文章迁移失败，请查看日志文件`);
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { StrapiToWordPressMigrator, type MigrationConfig, type MigrationReport };