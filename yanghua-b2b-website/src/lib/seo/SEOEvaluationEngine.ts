/**
 * SEO评估引擎
 * 用于评估关键词布局的SEO有效性和整体页面优化程度
 */

import { KeywordAnalysis, PageAnalysisResult, PageContent, KeywordConfig, KeywordType } from './KeywordAnalyzer';

/**
 * SEO评估规则
 */
export interface SEORule {
  name: string;
  weight: number;
  evaluate: (content: PageContent, analyses: KeywordAnalysis[]) => {
    score: number;
    issues: string[];
    suggestions: string[];
  };
}

/**
 * SEO评估结果
 */
export interface SEOEvaluationResult {
  overallScore: number;
  categoryScores: {
    titleOptimization: number;
    metaDescription: number;
    headingStructure: number;
    keywordDensity: number;
    contentQuality: number;
  };
  issues: string[];
  suggestions: string[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact: string;
  }[];
}

/**
 * SEO评估引擎类
 */
export class SEOEvaluationEngine {
  private rules: SEORule[] = [];

  constructor() {
    this.initializeRules();
  }

  /**
   * 初始化SEO评估规则
   */
  private initializeRules(): void {
    this.rules = [
      {
        name: 'title_optimization',
        weight: 25,
        evaluate: this.evaluateTitleOptimization.bind(this)
      },
      {
        name: 'meta_description',
        weight: 15,
        evaluate: this.evaluateMetaDescription.bind(this)
      },
      {
        name: 'heading_structure',
        weight: 20,
        evaluate: this.evaluateHeadingStructure.bind(this)
      },
      {
        name: 'keyword_density',
        weight: 25,
        evaluate: this.evaluateKeywordDensity.bind(this)
      },
      {
        name: 'content_quality',
        weight: 15,
        evaluate: this.evaluateContentQuality.bind(this)
      }
    ];
  }

  /**
   * 评估页面SEO
   */
  evaluatePage(content: PageContent, analyses: KeywordAnalysis[]): SEOEvaluationResult {
    const categoryScores: SEOEvaluationResult['categoryScores'] = {
      titleOptimization: 0,
      metaDescription: 0,
      headingStructure: 0,
      keywordDensity: 0,
      contentQuality: 0
    };

    const allIssues: string[] = [];
    const allSuggestions: string[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // 执行所有评估规则
    for (const rule of this.rules) {
      const result = rule.evaluate(content, analyses);
      const weightedScore = result.score * rule.weight / 100;
      
      totalWeightedScore += weightedScore;
      totalWeight += rule.weight;

      // 记录分类得分
      switch (rule.name) {
        case 'title_optimization':
          categoryScores.titleOptimization = result.score;
          break;
        case 'meta_description':
          categoryScores.metaDescription = result.score;
          break;
        case 'heading_structure':
          categoryScores.headingStructure = result.score;
          break;
        case 'keyword_density':
          categoryScores.keywordDensity = result.score;
          break;
        case 'content_quality':
          categoryScores.contentQuality = result.score;
          break;
      }

      allIssues.push(...result.issues);
      allSuggestions.push(...result.suggestions);
    }

    const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight * 100) : 0;
    const recommendations = this.generateRecommendations(categoryScores, analyses);

    return {
      overallScore,
      categoryScores,
      issues: [...new Set(allIssues)], // 去重
      suggestions: [...new Set(allSuggestions)], // 去重
      recommendations
    };
  }

  /**
   * 评估标题优化
   */
  private evaluateTitleOptimization(content: PageContent, analyses: KeywordAnalysis[]): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 检查标题长度
    if (!content.title) {
      issues.push('页面缺少标题');
      suggestions.push('添加页面标题');
      score -= 50;
    } else {
      const titleLength = content.title.length;
      if (titleLength < 30) {
        issues.push(`标题过短(${titleLength}字符)，建议30-60字符`);
        suggestions.push('扩展标题内容，增加相关关键词');
        score -= 20;
      } else if (titleLength > 60) {
        issues.push(`标题过长(${titleLength}字符)，可能在搜索结果中被截断`);
        suggestions.push('缩短标题长度至60字符以内');
        score -= 15;
      }
    }

    // 检查核心关键词在标题中的使用
    const coreKeywords = analyses.filter(a => a.type === KeywordType.CORE);
    const titleKeywordCount = coreKeywords.filter(a => a.positions.title.found).length;
    
    if (coreKeywords.length > 0 && titleKeywordCount === 0) {
      issues.push('标题中未包含核心关键词');
      suggestions.push('在标题中包含至少一个核心关键词');
      score -= 30;
    } else if (titleKeywordCount > 2) {
      issues.push('标题中包含过多关键词，可能影响可读性');
      suggestions.push('减少标题中的关键词数量，保持自然性');
      score -= 10;
    }

    // 检查标题的唯一性和吸引力
    if (content.title && this.isGenericTitle(content.title)) {
      issues.push('标题过于通用，缺乏吸引力');
      suggestions.push('使用更具体、更有吸引力的标题');
      score -= 15;
    }

    return { score: Math.max(0, score), issues, suggestions };
  }

  /**
   * 评估Meta描述
   */
  private evaluateMetaDescription(content: PageContent, analyses: KeywordAnalysis[]): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (!content.metaDescription) {
      issues.push('页面缺少Meta描述');
      suggestions.push('添加Meta描述，包含主要关键词和页面摘要');
      score = 0;
    } else {
      const descLength = content.metaDescription.length;
      if (descLength < 120) {
        issues.push(`Meta描述过短(${descLength}字符)，建议120-160字符`);
        suggestions.push('扩展Meta描述内容');
        score -= 20;
      } else if (descLength > 160) {
        issues.push(`Meta描述过长(${descLength}字符)，可能在搜索结果中被截断`);
        suggestions.push('缩短Meta描述至160字符以内');
        score -= 15;
      }

      // 检查关键词在Meta描述中的使用
      const keywordsInMeta = analyses.filter(a => a.positions.metaDescription.found).length;
      if (keywordsInMeta === 0) {
        issues.push('Meta描述中未包含关键词');
        suggestions.push('在Meta描述中自然地包含主要关键词');
        score -= 25;
      }

      // 检查是否有行动号召
      if (!this.hasCallToAction(content.metaDescription)) {
        suggestions.push('考虑在Meta描述中添加行动号召');
        score -= 5;
      }
    }

    return { score: Math.max(0, score), issues, suggestions };
  }

  /**
   * 评估标题结构
   */
  private evaluateHeadingStructure(content: PageContent, analyses: KeywordAnalysis[]): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 检查H1标签
    if (content.headings.h1.length === 0) {
      issues.push('页面缺少H1标签');
      suggestions.push('添加H1标签作为页面主标题');
      score -= 40;
    } else if (content.headings.h1.length > 1) {
      issues.push(`页面有多个H1标签(${content.headings.h1.length}个)`);
      suggestions.push('每个页面应该只有一个H1标签');
      score -= 20;
    }

    // 检查标题层级结构
    const headingLevels = [
      content.headings.h1.length,
      content.headings.h2.length,
      content.headings.h3.length,
      content.headings.h4.length,
      content.headings.h5.length,
      content.headings.h6.length
    ];

    // 检查是否跳级
    let hasSkippedLevel = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] > 0 && headingLevels[i-1] === 0) {
        hasSkippedLevel = true;
        break;
      }
    }

    if (hasSkippedLevel) {
      issues.push('标题层级结构不当，存在跳级现象');
      suggestions.push('按照H1->H2->H3的顺序组织标题结构');
      score -= 15;
    }

    // 检查关键词在标题中的分布
    const coreKeywords = analyses.filter(a => a.type === KeywordType.CORE);
    const h1WithKeywords = coreKeywords.filter(a => a.positions.headings.h1.found).length;
    
    if (coreKeywords.length > 0 && h1WithKeywords === 0) {
      issues.push('H1标签中未包含核心关键词');
      suggestions.push('在H1标签中包含主要关键词');
      score -= 25;
    }

    // 检查标题内容质量
    const allHeadings = [
      ...content.headings.h1,
      ...content.headings.h2,
      ...content.headings.h3,
      ...content.headings.h4,
      ...content.headings.h5,
      ...content.headings.h6
    ];

    const shortHeadings = allHeadings.filter(h => h.length < 10).length;
    if (shortHeadings > allHeadings.length * 0.3) {
      issues.push('部分标题过短，缺乏描述性');
      suggestions.push('使用更具描述性的标题');
      score -= 10;
    }

    return { score: Math.max(0, score), issues, suggestions };
  }

  /**
   * 评估关键词密度
   */
  private evaluateKeywordDensity(content: PageContent, analyses: KeywordAnalysis[]): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let totalScore = 0;
    let keywordCount = 0;

    for (const analysis of analyses) {
      keywordCount++;
      let keywordScore = 100;

      const density = analysis.positions.bodyText.density;
      const targetDensity = analysis.type === KeywordType.CORE ? 2.5 : 1.5;

      if (density === 0) {
        issues.push(`关键词"${analysis.keyword}"未出现在正文中`);
        suggestions.push(`在正文中自然地包含关键词"${analysis.keyword}"`);
        keywordScore = 0;
      } else if (density > targetDensity * 2) {
        issues.push(`关键词"${analysis.keyword}"密度过高(${density.toFixed(2)}%)`);
        suggestions.push(`减少关键词"${analysis.keyword}"的使用频率`);
        keywordScore -= 40;
      } else if (density < targetDensity * 0.5) {
        issues.push(`关键词"${analysis.keyword}"密度过低(${density.toFixed(2)}%)`);
        suggestions.push(`适当增加关键词"${analysis.keyword}"的使用`);
        keywordScore -= 20;
      }

      totalScore += keywordScore;
    }

    const averageScore = keywordCount > 0 ? totalScore / keywordCount : 0;
    return { score: Math.max(0, Math.round(averageScore)), issues, suggestions };
  }

  /**
   * 评估内容质量
   */
  private evaluateContentQuality(content: PageContent, analyses: KeywordAnalysis[]): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 检查内容长度
    if (content.wordCount < 300) {
      issues.push(`内容过短(${content.wordCount}词)，建议至少300词`);
      suggestions.push('增加内容长度，提供更详细的信息');
      score -= 30;
    } else if (content.wordCount > 3000) {
      suggestions.push('内容较长，考虑分段或分页以提高可读性');
      score -= 5;
    }

    // 检查关键词分布的自然性
    const keywordStuffingIssues = this.detectKeywordStuffing(content, analyses);
    if (keywordStuffingIssues.length > 0) {
      issues.push(...keywordStuffingIssues);
      suggestions.push('确保关键词使用自然，避免过度优化');
      score -= 25;
    }

    // 检查内容结构
    const totalHeadings = Object.values(content.headings).flat().length;
    if (totalHeadings === 0) {
      issues.push('内容缺少标题结构');
      suggestions.push('使用标题标签组织内容结构');
      score -= 20;
    } else if (content.wordCount > 500 && totalHeadings < 3) {
      suggestions.push('考虑添加更多标题来改善内容结构');
      score -= 10;
    }

    return { score: Math.max(0, score), issues, suggestions };
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(
    categoryScores: SEOEvaluationResult['categoryScores'],
    analyses: KeywordAnalysis[]
  ): SEOEvaluationResult['recommendations'] {
    const recommendations: SEOEvaluationResult['recommendations'] = [];

    // 基于分类得分生成建议
    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score < 60) {
        let priority: 'high' | 'medium' | 'low' = 'high';
        let description = '';
        let impact = '';

        switch (category) {
          case 'titleOptimization':
            description = '优化页面标题，包含核心关键词并保持适当长度';
            impact = '提高搜索结果点击率和排名';
            break;
          case 'metaDescription':
            description = '完善Meta描述，包含关键词和吸引用户的内容';
            impact = '提高搜索结果展示效果和点击率';
            priority = 'medium';
            break;
          case 'headingStructure':
            description = '改善标题结构，使用正确的H标签层级';
            impact = '提高内容可读性和搜索引擎理解';
            break;
          case 'keywordDensity':
            description = '调整关键词密度，确保自然分布';
            impact = '避免过度优化，提高内容质量';
            break;
          case 'contentQuality':
            description = '提升内容质量和长度，增加价值信息';
            impact = '提高用户体验和搜索引擎评价';
            priority = 'medium';
            break;
        }

        recommendations.push({
          priority,
          category,
          description,
          impact
        });
      }
    });

    // 基于关键词分析生成建议
    const lowScoreKeywords = analyses.filter(a => a.seoScore < 50);
    if (lowScoreKeywords.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'keyword_optimization',
        description: `优化低分关键词: ${lowScoreKeywords.map(k => k.keyword).join(', ')}`,
        impact: '提高目标关键词的搜索排名'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 检查是否为通用标题
   */
  private isGenericTitle(title: string): boolean {
    const genericPatterns = [
      /^首页$/,
      /^主页$/,
      /^欢迎$/,
      /^home$/i,
      /^welcome$/i,
      /^untitled$/i,
      /^新页面$/,
      /^页面$/
    ];

    return genericPatterns.some(pattern => pattern.test(title.trim()));
  }

  /**
   * 检查是否包含行动号召
   */
  private hasCallToAction(text: string): boolean {
    const ctaPatterns = [
      /了解更多/,
      /立即/,
      /马上/,
      /现在/,
      /联系我们/,
      /获取/,
      /下载/,
      /购买/,
      /learn more/i,
      /contact us/i,
      /get/i,
      /download/i,
      /buy/i
    ];

    return ctaPatterns.some(pattern => pattern.test(text));
  }

  /**
   * 检测关键词堆砌
   */
  private detectKeywordStuffing(content: PageContent, analyses: KeywordAnalysis[]): string[] {
    const issues: string[] = [];

    for (const analysis of analyses) {
      // 检查密度是否过高
      if (analysis.positions.bodyText.density > 5) {
        issues.push(`关键词"${analysis.keyword}"密度过高，可能存在堆砌`);
      }

      // 检查标题中的重复
      if (analysis.positions.title.count > 2) {
        issues.push(`关键词"${analysis.keyword}"在标题中重复过多`);
      }
    }

    return issues;
  }
}