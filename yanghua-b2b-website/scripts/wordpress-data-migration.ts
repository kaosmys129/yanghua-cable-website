#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import axios from 'axios';

interface WordPressConfig {
  siteUrl: string;
  username: string;
  password: string;
  applicationPassword?: string;
}

interface ProjectData {
  title: string;
  description: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  author: string;
  metadata: any;
}

interface NewsData {
  title: string;
  date: string;
  url?: string;
  image?: string;
  summary?: string;
  author?: string;
  content?: string;
}

interface MigrationStats {
  projectsTotal: number;
  projectsMigrated: number;
  projectsErrors: number;
  newsTotal: number;
  newsMigrated: number;
  newsErrors: number;
  startTime: Date;
  endTime?: Date;
  errors: string[];
}

class WordPressMigrator {
  private config: WordPressConfig;
  private stats: MigrationStats;
  private dataDir: string;

  constructor(config: WordPressConfig, dataDir: string) {
    this.config = config;
    this.dataDir = dataDir;
    this.stats = {
      projectsTotal: 0,
      projectsMigrated: 0,
      projectsErrors: 0,
      newsTotal: 0,
      newsMigrated: 0,
      newsErrors: 0,
      startTime: new Date(),
      errors: []
    };
  }

  async migrate(): Promise<MigrationStats> {
    console.log('🚀 开始WordPress数据迁移...');
    console.log(`目标站点: ${this.config.siteUrl}`);
    
    try {
      // 验证WordPress连接
      await this.validateConnection();
      
      // 迁移项目数据
      await this.migrateProjects();
      
      // 迁移新闻数据
      await this.migrateNews();
      
      this.stats.endTime = new Date();
      
      console.log('✅ 数据迁移完成！');
      this.printStats();
      
    } catch (error) {
      this.stats.errors.push(`迁移失败: ${error}`);
      console.error('❌ 迁移过程中发生错误:', error);
    }
    
    return this.stats;
  }

  private async validateConnection(): Promise<void> {
    console.log('🔍 验证WordPress连接...');
    
    try {
      const response = await axios.get(`${this.config.siteUrl}/wp-json/wp/v2/users/me`, {
        auth: {
          username: this.config.username,
          password: this.config.password
        }
      });
      
      console.log(`✅ 连接成功，用户: ${response.data.name}`);
    } catch (error) {
      throw new Error(`WordPress连接失败: ${error}`);
    }
  }

  private async migrateProjects(): Promise<void> {
    console.log('📁 开始迁移项目数据...');
    
    const projectsFile = path.join(this.dataDir, 'projects_complete_content.json');
    
    if (!fs.existsSync(projectsFile)) {
      throw new Error('项目数据文件不存在');
    }
    
    const projectsData = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
    const projects: ProjectData[] = projectsData.projects || [];
    
    this.stats.projectsTotal = projects.length;
    console.log(`📊 找到 ${projects.length} 个项目`);
    
    // 创建项目自定义文章类型（如果需要）
    await this.ensureProjectPostType();
    
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      console.log(`📝 迁移项目 ${i + 1}/${projects.length}: ${project.title}`);
      
      try {
        await this.createWordPressPost(project, 'project');
        this.stats.projectsMigrated++;
        console.log(`✅ 项目迁移成功: ${project.title}`);
      } catch (error) {
        this.stats.projectsErrors++;
        const errorMsg = `项目迁移失败 "${project.title}": ${error}`;
        this.stats.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
      
      // 避免请求过于频繁
      await this.delay(500);
    }
  }

  private async migrateNews(): Promise<void> {
    console.log('📰 开始迁移新闻数据...');
    
    const newsFiles = [
      'merged_news_with_content.json',
      'cleaned_news_data_english.json'
    ];
    
    for (const newsFile of newsFiles) {
      const filePath = path.join(this.dataDir, newsFile);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  新闻文件不存在: ${newsFile}`);
        continue;
      }
      
      console.log(`📄 处理新闻文件: ${newsFile}`);
      
      const newsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const news: NewsData[] = newsData.news || newsData || [];
      
      this.stats.newsTotal += news.length;
      console.log(`📊 找到 ${news.length} 条新闻`);
      
      for (let i = 0; i < news.length; i++) {
        const newsItem = news[i];
        console.log(`📝 迁移新闻 ${i + 1}/${news.length}: ${newsItem.title}`);
        
        try {
          await this.createWordPressPost(newsItem, 'post');
          this.stats.newsMigrated++;
          console.log(`✅ 新闻迁移成功: ${newsItem.title}`);
        } catch (error) {
          this.stats.newsErrors++;
          const errorMsg = `新闻迁移失败 "${newsItem.title}": ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
        
        // 避免请求过于频繁
        await this.delay(500);
      }
    }
  }

  private async ensureProjectPostType(): Promise<void> {
    // 这里可以通过插件或主题函数注册自定义文章类型
    // 暂时使用普通文章类型，并添加特定分类
    console.log('📋 确保项目文章类型存在...');
    
    try {
      // 创建项目分类
      await axios.post(`${this.config.siteUrl}/wp-json/wp/v2/categories`, {
        name: 'Projects',
        slug: 'projects',
        description: 'Company projects and case studies'
      }, {
        auth: {
          username: this.config.username,
          password: this.config.password
        }
      });
    } catch (error) {
      // 分类可能已存在，忽略错误
      console.log('📋 项目分类已存在或创建失败，继续迁移...');
    }
  }

  private async createWordPressPost(data: ProjectData | NewsData, type: 'project' | 'post'): Promise<void> {
    const postData: any = {
      title: data.title,
      content: this.formatContent(data),
      status: 'publish',
      date: this.formatDate(data),
      categories: type === 'project' ? await this.getProjectCategoryId() : [],
      tags: this.formatTags(data)
    };

    // 添加摘要
    if ('description' in data) {
      postData.excerpt = data.description;
    } else if ('summary' in data && data.summary) {
      postData.excerpt = data.summary;
    }

    // 添加特色图片
    if ('image' in data && data.image) {
      // 这里可以下载并上传图片，暂时保存URL到内容中
      postData.content += `\n\n<!-- Featured Image: ${data.image} -->`;
    }

    const response = await axios.post(`${this.config.siteUrl}/wp-json/wp/v2/posts`, postData, {
      auth: {
        username: this.config.username,
        password: this.config.password
      }
    });

    return response.data;
  }

  private formatContent(data: ProjectData | NewsData): string {
    let content = '';
    
    if ('content' in data && data.content) {
      content = data.content;
    } else if ('description' in data) {
      content = data.description;
    }
    
    // 添加元数据
    if ('metadata' in data && data.metadata) {
      content += '\n\n<!-- Metadata -->';
      content += '\n<div class="project-metadata">';
      
      Object.entries(data.metadata).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          content += `\n<p><strong>${key}:</strong> ${value}</p>`;
        }
      });
      
      content += '\n</div>';
    }
    
    return content;
  }

  private formatDate(data: ProjectData | NewsData): string {
    let dateStr = '';
    
    if ('created_at' in data) {
      dateStr = data.created_at;
    } else if ('date' in data) {
      dateStr = data.date;
    }
    
    // 确保日期格式正确
    const date = new Date(dateStr);
    return date.toISOString();
  }

  private formatTags(data: ProjectData | NewsData): string[] {
    if ('tags' in data && Array.isArray(data.tags)) {
      return data.tags;
    }
    return [];
  }

  private async getProjectCategoryId(): Promise<number[]> {
    try {
      const response = await axios.get(`${this.config.siteUrl}/wp-json/wp/v2/categories?slug=projects`, {
        auth: {
          username: this.config.username,
          password: this.config.password
        }
      });
      
      if (response.data.length > 0) {
        return [response.data[0].id];
      }
    } catch (error) {
      console.log('⚠️  获取项目分类ID失败');
    }
    
    return [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printStats(): void {
    const duration = this.stats.endTime ? 
      (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000 : 0;
    
    console.log('\n=== 迁移统计 ===');
    console.log(`⏱️  总耗时: ${duration.toFixed(2)}秒`);
    console.log(`📁 项目: ${this.stats.projectsMigrated}/${this.stats.projectsTotal} 成功`);
    console.log(`📰 新闻: ${this.stats.newsMigrated}/${this.stats.newsTotal} 成功`);
    console.log(`❌ 错误: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n错误详情:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
  }

  generateReport(): string {
    const duration = this.stats.endTime ? 
      (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000 : 0;
    
    let report = '# WordPress数据迁移报告\n\n';
    report += `**迁移时间:** ${this.stats.startTime.toLocaleString('zh-CN')}\n`;
    report += `**迁移耗时:** ${duration.toFixed(2)}秒\n`;
    report += `**目标站点:** ${this.config.siteUrl}\n\n`;
    
    report += '## 迁移统计\n\n';
    report += `- **项目数据:** ${this.stats.projectsMigrated}/${this.stats.projectsTotal} 成功迁移\n`;
    report += `- **新闻数据:** ${this.stats.newsMigrated}/${this.stats.newsTotal} 成功迁移\n`;
    report += `- **总错误数:** ${this.stats.errors.length}\n\n`;
    
    if (this.stats.errors.length > 0) {
      report += '## 错误详情\n\n';
      this.stats.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
      report += '\n';
    }
    
    report += '## 数据验证\n\n';
    const successRate = ((this.stats.projectsMigrated + this.stats.newsMigrated) / 
      (this.stats.projectsTotal + this.stats.newsTotal) * 100).toFixed(2);
    report += `- **成功率:** ${successRate}%\n`;
    report += `- **数据完整性:** ${this.stats.errors.length === 0 ? '✅ 完整' : '⚠️ 存在问题'}\n`;
    
    return report;
  }
}

async function main() {
  const config: WordPressConfig = {
    siteUrl: process.env.WP_SITE_URL || 'http://localhost:8080',
    username: process.env.WP_USERNAME || 'admin',
    password: process.env.WP_PASSWORD || 'admin'
  };
  
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const migrator = new WordPressMigrator(config, dataDir);
  
  const stats = await migrator.migrate();
  
  // 保存迁移报告
  const report = migrator.generateReport();
  const reportPath = path.join(process.cwd(), 'wordpress-migration-report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n📄 迁移报告已保存到: ${reportPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { WordPressMigrator };