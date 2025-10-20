/**
 * 关键词密度计算器
 * 用于计算关键词在页面各个位置的密度和频率
 */

import { KeywordConfig, KeywordType, KeywordAnalysis, PageContent } from './KeywordAnalyzer';

/**
 * 关键词匹配结果
 */
interface KeywordMatch {
  keyword: string;
  positions: number[];
  count: number;
}

/**
 * 关键词密度计算器类
 */
export class KeywordDensityCalculator {
  /**
   * 分析页面中的所有关键词
   */
  static analyzeKeywords(content: PageContent, keywords: KeywordConfig[]): KeywordAnalysis[] {
    const analyses: KeywordAnalysis[] = [];

    for (const keywordConfig of keywords) {
      const analysis = this.analyzeKeyword(content, keywordConfig);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * 分析单个关键词
   */
  private static analyzeKeyword(content: PageContent, keywordConfig: KeywordConfig): KeywordAnalysis {
    const keyword = keywordConfig.keyword.toLowerCase();
    
    // 分析标题中的关键词
    const titleAnalysis = this.analyzeTextForKeyword(content.title, keyword);
    
    // 分析Meta描述中的关键词
    const metaDescAnalysis = this.analyzeTextForKeyword(content.metaDescription, keyword);
    
    // 分析各级标题中的关键词
    const headingsAnalysis = {
      h1: this.analyzeArrayForKeyword(content.headings.h1, keyword),
      h2: this.analyzeArrayForKeyword(content.headings.h2, keyword),
      h3: this.analyzeArrayForKeyword(content.headings.h3, keyword),
      h4: this.analyzeArrayForKeyword(content.headings.h4, keyword),
      h5: this.analyzeArrayForKeyword(content.headings.h5, keyword),
      h6: this.analyzeArrayForKeyword(content.headings.h6, keyword)
    };
    
    // 分析正文中的关键词
    const bodyTextAnalysis = this.analyzeTextForKeyword(content.bodyText, keyword);
    const bodyTextDensity = content.wordCount > 0 ? (bodyTextAnalysis.count / content.wordCount) * 100 : 0;

    // 计算SEO评分
    const seoScore = this.calculateSEOScore(keywordConfig, {
      title: titleAnalysis,
      metaDescription: metaDescAnalysis,
      headings: headingsAnalysis,
      bodyText: { ...bodyTextAnalysis, density: bodyTextDensity }
    });

    // 生成问题和建议
    const { issues, suggestions } = this.generateRecommendations(keywordConfig, {
      title: titleAnalysis,
      metaDescription: metaDescAnalysis,
      headings: headingsAnalysis,
      bodyText: { ...bodyTextAnalysis, density: bodyTextDensity }
    });

    return {
      keyword: keywordConfig.keyword,
      type: keywordConfig.type,
      positions: {
        title: {
          found: titleAnalysis.count > 0,
          count: titleAnalysis.count,
          positions: titleAnalysis.positions
        },
        metaDescription: {
          found: metaDescAnalysis.count > 0,
          count: metaDescAnalysis.count,
          positions: metaDescAnalysis.positions
        },
        headings: {
          h1: { found: headingsAnalysis.h1.count > 0, count: headingsAnalysis.h1.count },
          h2: { found: headingsAnalysis.h2.count > 0, count: headingsAnalysis.h2.count },
          h3: { found: headingsAnalysis.h3.count > 0, count: headingsAnalysis.h3.count },
          h4: { found: headingsAnalysis.h4.count > 0, count: headingsAnalysis.h4.count },
          h5: { found: headingsAnalysis.h5.count > 0, count: headingsAnalysis.h5.count },
          h6: { found: headingsAnalysis.h6.count > 0, count: headingsAnalysis.h6.count }
        },
        bodyText: {
          found: bodyTextAnalysis.count > 0,
          count: bodyTextAnalysis.count,
          density: bodyTextDensity,
          positions: bodyTextAnalysis.positions
        }
      },
      seoScore,
      issues,
      suggestions
    };
  }

  /**
   * 在文本中分析关键词
   */
  private static analyzeTextForKeyword(text: string, keyword: string): KeywordMatch {
    if (!text || !keyword) {
      return { keyword, positions: [], count: 0 };
    }

    const lowerText = text.toLowerCase();
    const positions: number[] = [];
    let startIndex = 0;

    while (true) {
      const index = lowerText.indexOf(keyword, startIndex);
      if (index === -1) break;
      
      positions.push(index);
      startIndex = index + 1;
    }

    return {
      keyword,
      positions,
      count: positions.length
    };
  }

  /**
   * 在字符串数组中分析关键词
   */
  private static analyzeArrayForKeyword(textArray: string[], keyword: string): KeywordMatch {
    let totalCount = 0;
    const allPositions: number[] = [];

    for (const text of textArray) {
      const match = this.analyzeTextForKeyword(text, keyword);
      totalCount += match.count;
      allPositions.push(...match.positions);
    }

    return {
      keyword,
      positions: allPositions,
      count: totalCount
    };
  }

  /**
   * 计算SEO评分
   */
  private static calculateSEOScore(
    keywordConfig: KeywordConfig,
    analysis: {
      title: KeywordMatch;
      metaDescription: KeywordMatch;
      headings: Record<string, KeywordMatch>;
      bodyText: KeywordMatch & { density: number };
    }
  ): number {
    let score = 0;
    const maxScore = 100;

    // 标题权重 (30分)
    if (analysis.title.count > 0) {
      score += 30;
      // 如果标题中出现多次，稍微减分
      if (analysis.title.count > 2) {
        score -= 5;
      }
    }

    // Meta描述权重 (20分)
    if (analysis.metaDescription.count > 0) {
      score += 20;
      // 如果Meta描述中出现多次，稍微减分
      if (analysis.metaDescription.count > 2) {
        score -= 3;
      }
    }

    // H1标签权重 (25分)
    if (analysis.headings.h1.count > 0) {
      score += 25;
      // H1中出现多次会减分
      if (analysis.headings.h1.count > 1) {
        score -= 10;
      }
    }

    // 其他标题标签权重 (10分)
    const otherHeadingsCount = analysis.headings.h2.count + 
                              analysis.headings.h3.count + 
                              analysis.headings.h4.count + 
                              analysis.headings.h5.count + 
                              analysis.headings.h6.count;
    if (otherHeadingsCount > 0) {
      score += Math.min(10, otherHeadingsCount * 2);
    }

    // 正文密度权重 (15分)
    const targetDensity = keywordConfig.targetDensity || this.getRecommendedDensity(keywordConfig.type);
    const densityScore = this.calculateDensityScore(analysis.bodyText.density, targetDensity);
    score += densityScore * 0.15;

    // 根据关键词类型调整评分
    if (keywordConfig.type === KeywordType.CORE) {
      // 核心关键词要求更严格
      if (analysis.title.count === 0) score -= 10;
      if (analysis.headings.h1.count === 0) score -= 10;
    } else {
      // 长尾关键词相对宽松
      if (analysis.bodyText.count === 0) score -= 15;
    }

    // 根据优先级调整评分
    const priorityMultiplier = keywordConfig.priority / 10;
    score *= priorityMultiplier;

    return Math.max(0, Math.min(maxScore, Math.round(score)));
  }

  /**
   * 获取推荐的关键词密度
   */
  private static getRecommendedDensity(type: KeywordType): number {
    switch (type) {
      case KeywordType.CORE:
        return 2.5; // 核心关键词推荐密度 2-3%
      case KeywordType.LONG_TAIL:
        return 1.5; // 长尾关键词推荐密度 1-2%
      default:
        return 2.0;
    }
  }

  /**
   * 计算密度评分
   */
  private static calculateDensityScore(actualDensity: number, targetDensity: number): number {
    const difference = Math.abs(actualDensity - targetDensity);
    
    if (difference <= 0.5) {
      return 100; // 完美密度
    } else if (difference <= 1.0) {
      return 80; // 良好密度
    } else if (difference <= 2.0) {
      return 60; // 可接受密度
    } else if (difference <= 3.0) {
      return 40; // 需要优化
    } else {
      return 20; // 密度过高或过低
    }
  }

  /**
   * 生成优化建议
   */
  private static generateRecommendations(
    keywordConfig: KeywordConfig,
    analysis: {
      title: KeywordMatch;
      metaDescription: KeywordMatch;
      headings: Record<string, KeywordMatch>;
      bodyText: KeywordMatch & { density: number };
    }
  ): { issues: string[]; suggestions: string[]; } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 检查标题
    if (analysis.title.count === 0) {
      issues.push(`关键词"${keywordConfig.keyword}"未出现在页面标题中`);
      suggestions.push(`在页面标题中添加关键词"${keywordConfig.keyword}"`);
    } else if (analysis.title.count > 2) {
      issues.push(`关键词"${keywordConfig.keyword}"在标题中出现过多(${analysis.title.count}次)`);
      suggestions.push(`减少标题中关键词"${keywordConfig.keyword}"的使用频率，建议1-2次`);
    }

    // 检查Meta描述
    if (analysis.metaDescription.count === 0) {
      issues.push(`关键词"${keywordConfig.keyword}"未出现在Meta描述中`);
      suggestions.push(`在Meta描述中自然地包含关键词"${keywordConfig.keyword}"`);
    }

    // 检查H1标签
    if (analysis.headings.h1.count === 0 && keywordConfig.type === KeywordType.CORE) {
      issues.push(`核心关键词"${keywordConfig.keyword}"未出现在H1标签中`);
      suggestions.push(`在H1标签中包含核心关键词"${keywordConfig.keyword}"`);
    } else if (analysis.headings.h1.count > 1) {
      issues.push(`关键词"${keywordConfig.keyword}"在H1标签中出现多次(${analysis.headings.h1.count}次)`);
      suggestions.push(`H1标签中关键词"${keywordConfig.keyword}"应该只出现一次`);
    }

    // 检查正文密度
    const targetDensity = keywordConfig.targetDensity || this.getRecommendedDensity(keywordConfig.type);
    const densityDifference = Math.abs(analysis.bodyText.density - targetDensity);

    if (analysis.bodyText.density === 0) {
      issues.push(`关键词"${keywordConfig.keyword}"未出现在正文中`);
      suggestions.push(`在正文中自然地包含关键词"${keywordConfig.keyword}"，建议密度${targetDensity}%`);
    } else if (densityDifference > 1.0) {
      if (analysis.bodyText.density > targetDensity) {
        issues.push(`关键词"${keywordConfig.keyword}"密度过高(${analysis.bodyText.density.toFixed(2)}%)`);
        suggestions.push(`减少关键词"${keywordConfig.keyword}"在正文中的使用，目标密度${targetDensity}%`);
      } else {
        issues.push(`关键词"${keywordConfig.keyword}"密度过低(${analysis.bodyText.density.toFixed(2)}%)`);
        suggestions.push(`增加关键词"${keywordConfig.keyword}"在正文中的使用，目标密度${targetDensity}%`);
      }
    }

    // 检查其他标题标签
    const otherHeadingsCount = analysis.headings.h2.count + 
                              analysis.headings.h3.count + 
                              analysis.headings.h4.count + 
                              analysis.headings.h5.count + 
                              analysis.headings.h6.count;

    if (otherHeadingsCount === 0 && keywordConfig.type === KeywordType.CORE) {
      suggestions.push(`考虑在H2-H6标签中适当包含关键词"${keywordConfig.keyword}"的变体`);
    }

    return { issues, suggestions };
  }

  /**
   * 计算关键词相关性
   */
  static calculateKeywordRelevance(keyword1: string, keyword2: string): number {
    const words1 = keyword1.toLowerCase().split(/\s+/);
    const words2 = keyword2.toLowerCase().split(/\s+/);
    
    let commonWords = 0;
    const totalWords = new Set([...words1, ...words2]).size;
    
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        commonWords++;
      }
    }
    
    return totalWords > 0 ? (commonWords / totalWords) * 100 : 0;
  }

  /**
   * 检测关键词堆砌
   */
  static detectKeywordStuffing(content: PageContent, keyword: string): {
    isStuffing: boolean;
    severity: 'low' | 'medium' | 'high';
    details: string[];
  } {
    const details: string[] = [];
    let severityScore = 0;

    // 检查标题中的堆砌
    const titleWords = content.title.toLowerCase().split(/\s+/);
    const titleKeywordCount = titleWords.filter(word => word.includes(keyword.toLowerCase())).length;
    if (titleKeywordCount > 2) {
      details.push(`标题中关键词出现${titleKeywordCount}次，可能存在堆砌`);
      severityScore += titleKeywordCount;
    }

    // 检查正文密度
    const bodyWords = content.bodyText.toLowerCase().split(/\s+/);
    const bodyKeywordCount = bodyWords.filter(word => word.includes(keyword.toLowerCase())).length;
    const density = content.wordCount > 0 ? (bodyKeywordCount / content.wordCount) * 100 : 0;
    
    if (density > 5) {
      details.push(`正文关键词密度${density.toFixed(2)}%，超过推荐值`);
      severityScore += Math.floor(density);
    }

    // 检查连续出现
    const text = `${content.title} ${content.metaDescription} ${content.bodyText}`.toLowerCase();
    const keywordPattern = new RegExp(`(${keyword.toLowerCase()}\\s*){3,}`, 'g');
    const consecutiveMatches = text.match(keywordPattern);
    
    if (consecutiveMatches && consecutiveMatches.length > 0) {
      details.push(`发现关键词连续出现${consecutiveMatches.length}处`);
      severityScore += consecutiveMatches.length * 2;
    }

    let severity: 'low' | 'medium' | 'high' = 'low';
    if (severityScore > 15) {
      severity = 'high';
    } else if (severityScore > 8) {
      severity = 'medium';
    }

    return {
      isStuffing: severityScore > 5,
      severity,
      details
    };
  }
}