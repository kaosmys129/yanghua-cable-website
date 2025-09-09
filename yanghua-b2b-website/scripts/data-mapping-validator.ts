#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldMappings: Record<string, any>;
}

class DataMappingValidator {
  private dataDir: string;
  private validationResults: ValidationResult[] = [];

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    // 确保报告目录存在
    const reportDir = path.join(dataDir, '..', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  async validateAllData(): Promise<void> {
    console.log('🔍 开始数据映射验证...\n');

    // 验证项目数据
    await this.validateProjects();
    
    // 验证新闻数据
    await this.validateNews();
    
    // 生成验证报告
    this.generateReport();
  }

  private async validateProjects(): Promise<void> {
    console.log('📁 验证项目数据结构和映射...');
    
    const projectsFile = path.join(this.dataDir, 'projects_complete_content.json');
    
    if (!fs.existsSync(projectsFile)) {
      this.addValidationResult('projects', false, ['项目数据文件不存在']);
      return;
    }

    try {
      const projectsData = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
      const projects = projectsData.projects || [];

      if (projects.length === 0) {
        this.addValidationResult('projects', false, ['项目数据为空']);
        return;
      }

      const firstProject = projects[0];
      const fieldMappings = this.analyzeProjectFields(firstProject);
      const validationErrors = this.validateProjectStructure(firstProject);
      const warnings = this.generateProjectWarnings(firstProject);

      this.addValidationResult(
        'projects',
        validationErrors.length === 0,
        validationErrors,
        warnings,
        fieldMappings
      );

      console.log(`✅ 项目数据验证完成，找到 ${projects.length} 个项目`);
      
    } catch (error) {
      this.addValidationResult('projects', false, [`解析项目数据失败: ${error}`]);
    }
  }

  private async validateNews(): Promise<void> {
    console.log('📰 验证新闻数据结构和映射...');
    
    const newsFiles = [
      'merged_news_with_content.json',
      'cleaned_news_data_english.json',
      'cleaned_news_data_spanish.json'
    ];

    let totalNews = 0;
    let hasErrors = false;

    for (const newsFile of newsFiles) {
      const filePath = path.join(this.dataDir, newsFile);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  新闻文件不存在: ${newsFile}`);
        continue;
      }

      try {
        const newsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const news = newsData.news || newsData || [];
        
        if (news.length > 0) {
          const firstNews = news[0];
          const fieldMappings = this.analyzeNewsFields(firstNews);
          const validationErrors = this.validateNewsStructure(firstNews);
          const warnings = this.generateNewsWarnings(firstNews);

          this.addValidationResult(
            `news_${newsFile}`,
            validationErrors.length === 0,
            validationErrors,
            warnings,
            fieldMappings
          );

          totalNews += news.length;
        }
        
      } catch (error) {
        hasErrors = true;
        this.addValidationResult(`news_${newsFile}`, false, [`解析新闻数据失败: ${error}`]);
      }
    }

    if (totalNews > 0) {
      console.log(`✅ 新闻数据验证完成，找到 ${totalNews} 条新闻`);
    } else {
      console.log('⚠️  未找到有效的新闻数据');
    }
  }

  private analyzeProjectFields(project: any): Record<string, any> {
    return {
      'WordPress字段映射': {
        'post_title': project.title,
        'post_content': project.content,
        'post_excerpt': project.description,
        'post_date': project.created_at,
        'post_modified': project.updated_at,
        'post_author': project.author,
        'post_tags': project.tags,
        'meta_fields': {
          'client': project.metadata?.client,
          'industry': project.metadata?.industry,
          'location': project.metadata?.location,
          'duration': project.metadata?.duration,
          'completion_date': project.metadata?.completion_date,
          'project_scale': project.metadata?.project_scale,
          'power_efficiency': project.metadata?.power_efficiency,
          'space_savings': project.metadata?.space_savings,
          'products_used': project.metadata?.products_used,
          'testimonial': project.metadata?.testimonial,
          'testimonial_author': project.metadata?.testimonial_author,
          'testimonial_position': project.metadata?.testimonial_position
        }
      }
    };
  }

  private analyzeNewsFields(news: any): Record<string, any> {
    return {
      'WordPress字段映射': {
        'post_title': news.title,
        'post_content': news.content,
        'post_excerpt': news.summary,
        'post_date': news.date,
        'post_author': news.author || 'Yanghua STI',
        'featured_image': news.image,
        'meta_fields': {
          'original_url': news.url,
          'image_url': news.image
        }
      }
    };
  }

  private validateProjectStructure(project: any): string[] {
    const errors: string[] = [];
    const requiredFields = ['title', 'content', 'description', 'created_at', 'metadata'];
    
    requiredFields.forEach(field => {
      if (!project[field]) {
        errors.push(`缺少必需字段: ${field}`);
      }
    });

    if (project.metadata) {
      const requiredMeta = ['client', 'industry', 'location', 'completion_date'];
      requiredMeta.forEach(meta => {
        if (!project.metadata[meta]) {
          errors.push(`缺少元数据字段: ${meta}`);
        }
      });
    }

    if (project.created_at && !this.isValidDate(project.created_at)) {
      errors.push(`无效的日期格式: created_at`);
    }

    return errors;
  }

  private validateNewsStructure(news: any): string[] {
    const errors: string[] = [];
    const requiredFields = ['title', 'date'];
    
    requiredFields.forEach(field => {
      if (!news[field]) {
        errors.push(`缺少必需字段: ${field}`);
      }
    });

    if (news.date && !this.isValidDate(news.date)) {
      errors.push(`无效的日期格式: date`);
    }

    return errors;
  }

  private generateProjectWarnings(project: any): string[] {
    const warnings: string[] = [];
    
    if (!project.tags || project.tags.length === 0) {
      warnings.push('项目缺少标签信息');
    }

    if (!project.metadata?.testimonial) {
      warnings.push('项目缺少客户评价');
    }

    if (!Array.isArray(project.metadata?.products_used)) {
      warnings.push('项目产品信息格式可能不正确');
    }

    return warnings;
  }

  private generateNewsWarnings(news: any): string[] {
    const warnings: string[] = [];
    
    if (!news.content || news.content.length < 100) {
      warnings.push('新闻内容可能过短');
    }

    if (!news.image) {
      warnings.push('新闻缺少特色图片');
    }

    if (!news.summary) {
      warnings.push('新闻缺少摘要信息');
    }

    return warnings;
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private addValidationResult(
    dataType: string,
    isValid: boolean,
    errors: string[] = [],
    warnings: string[] = [],
    fieldMappings: Record<string, any> = {}
  ): void {
    this.validationResults.push({
      isValid,
      errors,
      warnings,
      fieldMappings
    });
  }

  private generateReport(): void {
    console.log('\n📊 数据映射验证报告');
    console.log('='.repeat(50));

    const totalValid = this.validationResults.filter(r => r.isValid).length;
    const totalErrors = this.validationResults.reduce((acc, r) => acc + r.errors.length, 0);
    const totalWarnings = this.validationResults.reduce((acc, r) => acc + r.warnings.length, 0);

    console.log(`总体验证结果: ${totalValid}/${this.validationResults.length} 通过`);
    console.log(`总错误数: ${totalErrors}`);
    console.log(`总警告数: ${totalWarnings}`);

    this.validationResults.forEach((result, index) => {
      console.log(`\n验证 ${index + 1}:`);
      console.log(`状态: ${result.isValid ? '✅ 通过' : '❌ 失败'}`);
      
      if (result.errors.length > 0) {
        console.log('错误:');
        result.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('警告:');
        result.warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      if (Object.keys(result.fieldMappings).length > 0) {
        console.log('字段映射:');
        console.log(JSON.stringify(result.fieldMappings, null, 2));
      }
    });

    // 保存详细报告
    const reportPath = path.join(this.dataDir, '..', 'reports', 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.validationResults
    }, null, 2));
    
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
  }
}

// 执行验证
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'backup', 'original-data');
const validator = new DataMappingValidator(dataDir);

validator.validateAllData().catch(console.error);