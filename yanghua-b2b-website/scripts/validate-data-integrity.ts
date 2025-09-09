#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Data validation interfaces
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalItems: number;
    validItems: number;
    invalidItems: number;
  };
}

interface ProjectValidation extends ValidationResult {
  duplicates: string[];
  missingFields: Array<{ title: string; fields: string[] }>;
}

interface NewsValidation extends ValidationResult {
  duplicates: string[];
  missingFields: Array<{ title: string; fields: string[] }>;
  dateIssues: Array<{ title: string; date: string; issue: string }>;
}

class DataValidator {
  private logFile: string;

  constructor() {
    this.logFile = path.join(process.cwd(), 'validation.log');
    // Clear previous log
    if (fs.existsSync(this.logFile)) {
      fs.unlinkSync(this.logFile);
    }
  }

  private log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  private validateRequiredFields(item: any, requiredFields: string[], itemType: string, itemTitle: string): string[] {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (field.includes('.')) {
        // Handle nested fields like 'metadata.client'
        const parts = field.split('.');
        let current = item;
        let isValid = true;
        
        for (const part of parts) {
          if (!current || typeof current !== 'object' || !(part in current)) {
            isValid = false;
            break;
          }
          current = current[part];
        }
        
        if (!isValid || current === null || current === undefined || current === '') {
          missingFields.push(field);
        }
      } else {
        if (!item[field] || item[field] === null || item[field] === undefined || item[field] === '') {
          missingFields.push(field);
        }
      }
    }
    
    return missingFields;
  }

  private findDuplicates(items: any[], keyField: string): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    
    for (const item of items) {
      const key = item[keyField];
      if (key) {
        if (seen.has(key)) {
          duplicates.add(key);
        } else {
          seen.add(key);
        }
      }
    }
    
    return Array.from(duplicates);
  }

  private validateStringLength(value: string, maxLength: number, fieldName: string): string[] {
    const errors: string[] = [];
    
    if (value && value.length > maxLength) {
      errors.push(`${fieldName} exceeds maximum length of ${maxLength} characters (current: ${value.length})`);
    }
    
    return errors;
  }

  private validateDate(dateString: string, fieldName: string): { isValid: boolean; error?: string } {
    if (!dateString) {
      return { isValid: false, error: `${fieldName} is empty` };
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { isValid: false, error: `${fieldName} is not a valid date: ${dateString}` };
      }
      
      // Check if date is reasonable (not too far in the past or future)
      const now = new Date();
      const minDate = new Date('2000-01-01');
      const maxDate = new Date(now.getFullYear() + 1, 11, 31);
      
      if (date < minDate || date > maxDate) {
        return { isValid: false, error: `${fieldName} is outside reasonable range: ${dateString}` };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: `${fieldName} parsing failed: ${dateString}` };
    }
  }

  async validateProjects(): Promise<ProjectValidation> {
    this.log('Starting projects data validation...');
    
    const projectsPath = path.join(process.cwd(), 'public/data/projects_complete_content.json');
    
    if (!fs.existsSync(projectsPath)) {
      return {
        isValid: false,
        errors: [`Projects data file not found: ${projectsPath}`],
        warnings: [],
        stats: { totalItems: 0, validItems: 0, invalidItems: 0 },
        duplicates: [],
        missingFields: []
      };
    }

    let projectsData;
    try {
      const fileContent = fs.readFileSync(projectsPath, 'utf8');
      projectsData = JSON.parse(fileContent);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to parse projects JSON: ${error}`],
        warnings: [],
        stats: { totalItems: 0, validItems: 0, invalidItems: 0 },
        duplicates: [],
        missingFields: []
      };
    }

    const projects = projectsData.projects || [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: Array<{ title: string; fields: string[] }> = [];
    let validItems = 0;

    // Required fields for projects
    const requiredFields = ['title'];
    const recommendedFields = ['description', 'metadata.client', 'metadata.industry', 'metadata.location'];

    // Find duplicates
    const duplicates = this.findDuplicates(projects, 'title');
    if (duplicates.length > 0) {
      errors.push(`Found ${duplicates.length} duplicate project titles`);
      duplicates.forEach(title => {
        this.log(`Duplicate project title: ${title}`, 'ERROR');
      });
    }

    // Validate each project
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const projectTitle = project.title || `Project #${i + 1}`;
      let isProjectValid = true;

      // Check required fields
      const missing = this.validateRequiredFields(project, requiredFields, 'project', projectTitle);
      if (missing.length > 0) {
        missingFields.push({ title: projectTitle, fields: missing });
        errors.push(`Project "${projectTitle}" missing required fields: ${missing.join(', ')}`);
        isProjectValid = false;
      }

      // Check recommended fields
      const missingRecommended = this.validateRequiredFields(project, recommendedFields, 'project', projectTitle);
      if (missingRecommended.length > 0) {
        warnings.push(`Project "${projectTitle}" missing recommended fields: ${missingRecommended.join(', ')}`);
      }

      // Validate field lengths
      if (project.title) {
        const titleErrors = this.validateStringLength(project.title, 200, 'title');
        if (titleErrors.length > 0) {
          errors.push(`Project "${projectTitle}": ${titleErrors.join(', ')}`);
          isProjectValid = false;
        }
      }

      if (project.description) {
        const descErrors = this.validateStringLength(project.description, 1000, 'description');
        if (descErrors.length > 0) {
          warnings.push(`Project "${projectTitle}": ${descErrors.join(', ')}`);
        }
      }

      // Validate dates
      if (project.metadata?.completion_date) {
        const dateValidation = this.validateDate(project.metadata.completion_date, 'completion_date');
        if (!dateValidation.isValid) {
          warnings.push(`Project "${projectTitle}": ${dateValidation.error}`);
        }
      }

      if (project.created_at) {
        const dateValidation = this.validateDate(project.created_at, 'created_at');
        if (!dateValidation.isValid) {
          warnings.push(`Project "${projectTitle}": ${dateValidation.error}`);
        }
      }

      if (isProjectValid) {
        validItems++;
      }
    }

    const result: ProjectValidation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalItems: projects.length,
        validItems,
        invalidItems: projects.length - validItems
      },
      duplicates,
      missingFields
    };

    this.log(`Projects validation completed: ${validItems}/${projects.length} valid`);
    return result;
  }

  async validateNews(): Promise<NewsValidation> {
    this.log('Starting news data validation...');
    
    const newsPath = path.join(process.cwd(), 'public/data/cleaned_news_data_english.json');
    
    if (!fs.existsSync(newsPath)) {
      return {
        isValid: false,
        errors: [`News data file not found: ${newsPath}`],
        warnings: [],
        stats: { totalItems: 0, validItems: 0, invalidItems: 0 },
        duplicates: [],
        missingFields: [],
        dateIssues: []
      };
    }

    let newsData;
    try {
      const fileContent = fs.readFileSync(newsPath, 'utf8');
      newsData = JSON.parse(fileContent);
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to parse news JSON: ${error}`],
        warnings: [],
        stats: { totalItems: 0, validItems: 0, invalidItems: 0 },
        duplicates: [],
        missingFields: [],
        dateIssues: []
      };
    }

    const articles = newsData.news || [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: Array<{ title: string; fields: string[] }> = [];
    const dateIssues: Array<{ title: string; date: string; issue: string }> = [];
    let validItems = 0;

    // Required fields for articles
    const requiredFields = ['title', 'date'];
    const recommendedFields = ['summary', 'author'];

    // Find duplicates
    const duplicates = this.findDuplicates(articles, 'title');
    if (duplicates.length > 0) {
      errors.push(`Found ${duplicates.length} duplicate article titles`);
      duplicates.forEach(title => {
        this.log(`Duplicate article title: ${title}`, 'ERROR');
      });
    }

    // Validate each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const articleTitle = article.title || `Article #${i + 1}`;
      let isArticleValid = true;

      // Check required fields
      const missing = this.validateRequiredFields(article, requiredFields, 'article', articleTitle);
      if (missing.length > 0) {
        missingFields.push({ title: articleTitle, fields: missing });
        errors.push(`Article "${articleTitle}" missing required fields: ${missing.join(', ')}`);
        isArticleValid = false;
      }

      // Check recommended fields
      const missingRecommended = this.validateRequiredFields(article, recommendedFields, 'article', articleTitle);
      if (missingRecommended.length > 0) {
        warnings.push(`Article "${articleTitle}" missing recommended fields: ${missingRecommended.join(', ')}`);
      }

      // Validate field lengths
      if (article.title) {
        const titleErrors = this.validateStringLength(article.title, 200, 'title');
        if (titleErrors.length > 0) {
          errors.push(`Article "${articleTitle}": ${titleErrors.join(', ')}`);
          isArticleValid = false;
        }
      }

      if (article.summary) {
        const summaryErrors = this.validateStringLength(article.summary, 500, 'summary');
        if (summaryErrors.length > 0) {
          warnings.push(`Article "${articleTitle}": ${summaryErrors.join(', ')}`);
        }
      }

      // Validate date
      if (article.date) {
        const dateValidation = this.validateDate(article.date, 'date');
        if (!dateValidation.isValid) {
          dateIssues.push({
            title: articleTitle,
            date: article.date,
            issue: dateValidation.error || 'Unknown date issue'
          });
          warnings.push(`Article "${articleTitle}": ${dateValidation.error}`);
        }
      }

      // Check for empty content
      if (!article.content && !article.summary) {
        warnings.push(`Article "${articleTitle}" has no content or summary`);
      }

      if (isArticleValid) {
        validItems++;
      }
    }

    const result: NewsValidation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalItems: articles.length,
        validItems,
        invalidItems: articles.length - validItems
      },
      duplicates,
      missingFields,
      dateIssues
    };

    this.log(`News validation completed: ${validItems}/${articles.length} valid`);
    return result;
  }

  async generateValidationReport(projectValidation: ProjectValidation, newsValidation: NewsValidation) {
    const reportPath = path.join(process.cwd(), 'data-validation-report.md');
    const timestamp = new Date().toISOString();
    
    const report = `# Data Validation Report

**Generated:** ${timestamp}

## Summary

### Projects Validation
- **Total Items:** ${projectValidation.stats.totalItems}
- **Valid Items:** ${projectValidation.stats.validItems}
- **Invalid Items:** ${projectValidation.stats.invalidItems}
- **Success Rate:** ${projectValidation.stats.totalItems > 0 ? Math.round((projectValidation.stats.validItems / projectValidation.stats.totalItems) * 100) : 0}%
- **Duplicates Found:** ${projectValidation.duplicates.length}
- **Errors:** ${projectValidation.errors.length}
- **Warnings:** ${projectValidation.warnings.length}

### News Validation
- **Total Items:** ${newsValidation.stats.totalItems}
- **Valid Items:** ${newsValidation.stats.validItems}
- **Invalid Items:** ${newsValidation.stats.invalidItems}
- **Success Rate:** ${newsValidation.stats.totalItems > 0 ? Math.round((newsValidation.stats.validItems / newsValidation.stats.totalItems) * 100) : 0}%
- **Duplicates Found:** ${newsValidation.duplicates.length}
- **Date Issues:** ${newsValidation.dateIssues.length}
- **Errors:** ${newsValidation.errors.length}
- **Warnings:** ${newsValidation.warnings.length}

## Detailed Results

### Projects Issues

#### Errors
${projectValidation.errors.map(e => `- ${e}`).join('\n') || 'No errors found'}

#### Warnings
${projectValidation.warnings.map(w => `- ${w}`).join('\n') || 'No warnings'}

#### Duplicate Titles
${projectValidation.duplicates.map(d => `- ${d}`).join('\n') || 'No duplicates found'}

#### Missing Required Fields
${projectValidation.missingFields.map(m => `- **${m.title}:** ${m.fields.join(', ')}`).join('\n') || 'All required fields present'}

### News Issues

#### Errors
${newsValidation.errors.map(e => `- ${e}`).join('\n') || 'No errors found'}

#### Warnings
${newsValidation.warnings.map(w => `- ${w}`).join('\n') || 'No warnings'}

#### Duplicate Titles
${newsValidation.duplicates.map(d => `- ${d}`).join('\n') || 'No duplicates found'}

#### Date Issues
${newsValidation.dateIssues.map(d => `- **${d.title}:** ${d.date} - ${d.issue}`).join('\n') || 'No date issues found'}

#### Missing Required Fields
${newsValidation.missingFields.map(m => `- **${m.title}:** ${m.fields.join(', ')}`).join('\n') || 'All required fields present'}

## Recommendations

### Before Migration
1. **Fix Critical Errors:** Address all items marked as errors before proceeding with migration
2. **Review Duplicates:** Decide how to handle duplicate titles (merge, rename, or skip)
3. **Validate Dates:** Ensure all dates are in correct format and reasonable range
4. **Add Missing Content:** Consider adding missing summaries or content where possible

### Migration Strategy
- Items with errors should be fixed or excluded from migration
- Items with warnings can be migrated but may need manual review
- Consider implementing data cleanup scripts for common issues

---

**Overall Status:** ${projectValidation.isValid && newsValidation.isValid ? '✅ Ready for Migration' : '⚠️ Issues Found - Review Required'}

*Validation completed at ${timestamp}*
`;

    fs.writeFileSync(reportPath, report);
    this.log(`Validation report generated: ${reportPath}`);
  }

  async run() {
    try {
      this.log('=== Starting Data Validation ===');
      
      // Validate projects
      const projectValidation = await this.validateProjects();
      
      // Validate news
      const newsValidation = await this.validateNews();
      
      // Generate report
      await this.generateValidationReport(projectValidation, newsValidation);
      
      this.log('=== Validation Completed ===');
      
      // Display summary
      console.log('\n📊 Validation Summary:');
      console.log(`Projects: ${projectValidation.stats.validItems}/${projectValidation.stats.totalItems} valid (${projectValidation.errors.length} errors, ${projectValidation.warnings.length} warnings)`);
      console.log(`News: ${newsValidation.stats.validItems}/${newsValidation.stats.totalItems} valid (${newsValidation.errors.length} errors, ${newsValidation.warnings.length} warnings)`);
      
      const hasErrors = projectValidation.errors.length > 0 || newsValidation.errors.length > 0;
      const hasWarnings = projectValidation.warnings.length > 0 || newsValidation.warnings.length > 0;
      
      if (hasErrors) {
        console.log('\n❌ Critical errors found. Please fix these before migration.');
        console.log('Check data-validation-report.md for detailed information.');
        process.exit(1);
      } else if (hasWarnings) {
        console.log('\n⚠️ Warnings found. Review data-validation-report.md before proceeding.');
        console.log('Migration can proceed but manual review is recommended.');
      } else {
        console.log('\n✅ All data is valid and ready for migration!');
      }
      
    } catch (error) {
      this.log(`Validation failed: ${error}`, 'ERROR');
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  }
}

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DataValidator();
  validator.run();
}

export { DataValidator };