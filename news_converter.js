const fs = require('fs');
const path = require('path');

class NewsConverter {
  constructor() {
    this.articles = [];
    this.companyInfo = {};
  }

  // 读取并解析Markdown文件
  parseMarkdownFile(filePath) {
    try {
      const mdContent = fs.readFileSync(filePath, 'utf8');
      console.log(`文件读取成功，总长度: ${mdContent.length} 字符`);
      
      // 解析公司信息
      this.parseCompanyInfo(mdContent);
      
      // 解析文章内容
      this.parseArticles(mdContent);
      
      return true;
    } catch (error) {
      console.error('文件读取失败:', error.message);
      return false;
    }
  }

  // 解析公司信息
  parseCompanyInfo(content) {
    const companySection = content.split('---')[0];
    
    const companyMatch = companySection.match(/\*\*Company\*\*: (.+)/);
    const websiteMatch = companySection.match(/\*\*Website\*\*: (.+)/);
    const totalMatch = companySection.match(/\*\*Total Articles\*\*: (\d+)/);
    const dateMatch = companySection.match(/\*\*Extraction Date\*\*: (.+)/);

    this.companyInfo = {
      name: companyMatch ? companyMatch[1].trim() : '',
      website: websiteMatch ? websiteMatch[1].trim() : '',
      totalArticles: totalMatch ? parseInt(totalMatch[1]) : 0,
      extractionDate: dateMatch ? dateMatch[1].trim() : ''
    };

    console.log('公司信息解析完成:', this.companyInfo);
  }

  // 解析文章内容
  parseArticles(content) {
    // 精确匹配文档中的格式
    const articleRegex = /## Article (\d+): ([^\n]+)\n\*\*Date\*\*: (\d{4}-\d{2}-\d{2})\s*\n\*\*URL\*\*: (https?:\/\/[^\s]+)\s*\n+### Content:\s*\n([\s\S]*?)(?=\n---\n|## Article \d+:|$)/g;
    
    let match;
    let articleCount = 0;

    while ((match = articleRegex.exec(content)) !== null) {
      const articleData = {
        rawId: parseInt(match[1]),
        rawTitle: match[2].trim(),
        rawDate: match[3],
        rawUrl: match[4],
        rawContent: match[5].trim()
      };

      // 转换为符合NewsArticle接口的格式
      const newsArticle = this.convertToNewsArticle(articleData);
      
      this.articles.push(newsArticle);
      articleCount++;

      console.log(`解析文章 ${articleCount}: ${newsArticle.title.substring(0, 50)}...`);
    }

    console.log(`总共解析了 ${articleCount} 篇文章`);

    // 如果没有解析到文章，进行调试
    if (articleCount === 0) {
      this.debugArticleParsing(content);
    }
  }

  // 转换为NewsArticle接口格式
  convertToNewsArticle(articleData) {
    // 处理内容，移除Markdown格式获取纯文本
    const plainText = this.extractPlainText(articleData.rawContent);
    
    // 生成符合接口的文章对象
    const newsArticle = {
      id: articleData.rawId.toString(), // 转换为字符串
      title: articleData.rawTitle,
      excerpt: this.generateExcerpt(plainText), // 改为excerpt
      content: articleData.rawContent, // 保持原始markdown内容
      date: articleData.rawDate,
      readTime: this.calculateReadTime(plainText), // 改为字符串格式
      category: this.categorizeArticle(articleData.rawTitle, plainText),
      author: this.extractAuthor(articleData.rawContent), // 提取或设置默认作者
      image: this.extractMainImage(articleData.rawContent), // 改为image
      featured: this.determineFeatured(articleData.rawId, articleData.rawTitle), // 可选字段
      tags: this.extractTags(plainText) // 改为tags
    };

    return newsArticle;
  }

  // 提取纯文本内容
  extractPlainText(content) {
    return content
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/\n{2,}/g, '\n') // 合并多个换行
      .replace(/[^\u4e00-\u9fa5\u0041-\u005a\u0061-\u007a0-9\s]/g, '') // 保留中英文数字和空格
      .trim();
  }

  // 生成文章摘要
  generateExcerpt(text, maxLength = 150) {
    // 移除多余的换行和空格
    let excerpt = text.replace(/\s+/g, ' ').trim();
    
    if (excerpt.length <= maxLength) {
      return excerpt;
    }

    // 在句号处截断，确保完整性
    const truncated = excerpt.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('。');
    const lastExclamation = truncated.lastIndexOf('！');
    const lastQuestion = truncated.lastIndexOf('？');
    const lastDot = truncated.lastIndexOf('.');
    
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion, lastDot);
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    return truncated + '...';
  }

  // 计算阅读时间（返回字符串格式）
  calculateReadTime(text) {
    const wordsPerMinute = 200; // 中英文混合阅读速度
    const wordCount = text.length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    if (minutes <= 1) {
      return '1分钟';
    } else if (minutes < 60) {
      return `${minutes}分钟`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
    }
  }

  // 文章分类
  categorizeArticle(title, content) {
    const categories = {
      'technology': ['柔性母线', '技术', '产品', '设备', '解决方案', '创新'],
      'industry': ['化工', '工业', '应用', '项目', '企业', '工厂'],
      'news': ['新闻', '展览', '论坛', '会议', '活动', '发布'],
      'company': ['公司', '合作', '投资', '发展', '团队'],
      'market': ['市场', '销售', '客户', '业务', '商业']
    };

    const fullText = (title + ' ' + content).toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => fullText.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  // 提取作者信息
  extractAuthor(content) {
    // 尝试从内容中提取作者信息，如果没有则使用默认值
    const authorMatch = content.match(/作者[：:]\s*([^\n]+)/);
    if (authorMatch) {
      return authorMatch[1].trim();
    }

    // 根据文章类型设置默认作者
    return 'Yanghuasti Technology';
  }

  // 提取主要图片
  extractMainImage(content) {
    const imageRegex = /!\[.*?\]\((.*?)\)/;
    const match = content.match(imageRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // 如果没有图片，返回默认图片或空字符串
    return 'https://yanghuasti.oss-cn-shenzhen.aliyuncs.com/default-news-image.jpg';
  }

  // 确定是否为推荐文章
  determineFeatured(id, title) {
    // 根据文章ID或标题关键词确定是否为推荐文章
    const featuredKeywords = ['重要', '重大', '突破', '创新', '首次', '发布', '展览'];
    const titleLower = title.toLowerCase();
    
    // 前3篇文章自动设为推荐
    if (id <= 3) {
      return true;
    }
    
    // 包含特定关键词的文章设为推荐
    return featuredKeywords.some(keyword => titleLower.includes(keyword));
  }

  // 提取标签
  extractTags(text) {
    const tags = new Set();
    
    // 预定义的标签列表
    const predefinedTags = [
      '柔性母线', '化工厂', '并联电缆', '高电流', '配电系统', 
      '新能源', '储能', '充电桩', '工业应用', '安装技术',
      '安全防护', '低碳节能', '数字能源', '智能制造', '技术创新',
      '产品展示', '行业论坛', '企业合作', '市场拓展', '解决方案'
    ];

    predefinedTags.forEach(tag => {
      if (text.includes(tag)) {
        tags.add(tag);
      }
    });

    // 如果标签数量少于3个，添加一些通用标签
    const tagsArray = Array.from(tags);
    if (tagsArray.length < 3) {
      const defaultTags = ['电力设备', '工业技术', '企业动态'];
      defaultTags.forEach(tag => {
        if (tagsArray.length < 3) {
          tagsArray.push(tag);
        }
      });
    }

    return tagsArray.slice(0, 5); // 最多返回5个标签
  }

  // 调试文章解析
  debugArticleParsing(content) {
    console.log('\n=== 调试信息 ===');
    
    const lines = content.split('\n');
    
    // 查找文章标题行
    const articleTitleLines = lines.filter(line => line.match(/^## Article \d+:/));
    console.log(`找到 ${articleTitleLines.length} 个文章标题行:`);
    articleTitleLines.slice(0, 3).forEach((line, index) => {
      console.log(`  ${index + 1}: "${line}"`);
    });

    // 查找日期行
    const dateLines = lines.filter(line => line.includes('**Date**'));
    console.log(`\n找到 ${dateLines.length} 个日期行:`);
    dateLines.slice(0, 3).forEach((line, index) => {
      console.log(`  ${index + 1}: "${line}"`);
    });

    // 查找URL行
    const urlLines = lines.filter(line => line.includes('**URL**'));
    console.log(`\n找到 ${urlLines.length} 个URL行:`);
    urlLines.slice(0, 3).forEach((line, index) => {
      console.log(`  ${index + 1}: "${line}"`);
    });

    // 查找Content行
    const contentLines = lines.filter(line => line.includes('### Content:'));
    console.log(`\n找到 ${contentLines.length} 个Content行:`);
    contentLines.slice(0, 3).forEach((line, index) => {
      console.log(`  ${index + 1}: "${line}"`);
    });
  }

  // 生成符合NewsArticle接口的JSON数据
  generateNewsArticleJson() {
    return this.articles.map(article => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      date: article.date,
      readTime: article.readTime,
      category: article.category,
      author: article.author,
      image: article.image,
      featured: article.featured,
      tags: article.tags
    }));
  }

  // 生成分类统计
  generateCategoryStats() {
    const categoryStats = {};
    this.articles.forEach(article => {
      const category = article.category;
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    return categoryStats;
  }

  // 生成标签统计
  generateTagStats() {
    const tagStats = {};
    this.articles.forEach(article => {
      article.tags.forEach(tag => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    });
    
    // 返回排序后的标签统计
    return Object.entries(tagStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));
  }

  // 保存JSON文件
  saveJsonFiles(outputDir = './output') {
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // 1. 保存新闻文章数据（符合NewsArticle接口）
      const newsArticlesPath = path.join(outputDir, 'news-articles.json');
      const newsArticlesData = this.generateNewsArticleJson();
      fs.writeFileSync(newsArticlesPath, JSON.stringify(newsArticlesData, null, 2), 'utf8');
      console.log(`✅ 新闻文章JSON已保存: ${newsArticlesPath}`);

      // 2. 保存推荐文章数据
      const featuredNewsPath = path.join(outputDir, 'featured-news.json');
      const featuredNews = newsArticlesData.filter(article => article.featured);
      fs.writeFileSync(featuredNewsPath, JSON.stringify(featuredNews, null, 2), 'utf8');
      console.log(`✅ 推荐文章JSON已保存: ${featuredNewsPath}`);

      // 3. 保存按分类的文章数据
      const newsByCategoryPath = path.join(outputDir, 'news-by-category.json');
      const newsByCategory = {};
      newsArticlesData.forEach(article => {
        const category = article.category;
        if (!newsByCategory[category]) {
          newsByCategory[category] = [];
        }
        newsByCategory[category].push(article);
      });
      fs.writeFileSync(newsByCategoryPath, JSON.stringify(newsByCategory, null, 2), 'utf8');
      console.log(`✅ 分类新闻JSON已保存: ${newsByCategoryPath}`);

      // 4. 保存网站元数据
      const metadataPath = path.join(outputDir, 'news-metadata.json');
      const metadata = {
        companyInfo: this.companyInfo,
        totalArticles: this.articles.length,
        featuredCount: featuredNews.length,
        categoryStats: this.generateCategoryStats(),
        tagStats: this.generateTagStats(),
        lastUpdated: new Date().toISOString(),
        dateRange: {
          earliest: Math.min(...this.articles.map(a => new Date(a.date).getTime())),
          latest: Math.max(...this.articles.map(a => new Date(a.date).getTime()))
        }
      };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      console.log(`✅ 网站元数据JSON已保存: ${metadataPath}`);

      return true;
    } catch (error) {
      console.error('❌ 保存JSON文件失败:', error.message);
      return false;
    }
  }

  // 验证数据格式
  validateNewsArticleFormat() {
    const errors = [];
    
    this.articles.forEach((article, index) => {
      // 检查必需字段
      const requiredFields = ['id', 'title', 'excerpt', 'content', 'date', 'readTime', 'category', 'author', 'image'];
      requiredFields.forEach(field => {
        if (!article[field] || article[field] === '') {
          errors.push(`文章 ${index + 1}: 缺少必需字段 ${field}`);
        }
      });

      // 检查字段类型
      if (typeof article.id !== 'string') {
        errors.push(`文章 ${index + 1}: id 应为字符串类型`);
      }
      
      if (typeof article.featured !== 'boolean' && article.featured !== undefined) {
        errors.push(`文章 ${index + 1}: featured 应为布尔类型`);
      }
      
      if (!Array.isArray(article.tags)) {
        errors.push(`文章 ${index + 1}: tags 应为数组类型`);
      }
    });

    if (errors.length > 0) {
      console.log('\n⚠️  数据格式验证发现问题:');
      errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('\n✅ 数据格式验证通过');
    }

    return errors.length === 0;
  }
}

// 主函数
function main() {
  console.log('🚀 开始转换新闻数据为NewsArticle格式...\n');

  const converter = new NewsConverter();
  const inputFile = path.join(__dirname, 'yanghuasti_news_formatted.md');

  // 解析Markdown文件
  if (!converter.parseMarkdownFile(inputFile)) {
    console.error('❌ 文件解析失败，程序退出');
    process.exit(1);
  }

  // 验证数据格式
  converter.validateNewsArticleFormat();

  // 保存JSON文件
  if (converter.saveJsonFiles()) {
    console.log('\n🎉 转换完成！');
    console.log(`📊 总共处理了 ${converter.articles.length} 篇文章`);
    console.log(`🌟 其中 ${converter.articles.filter(a => a.featured).length} 篇为推荐文章`);
    console.log('\n生成的文件:');
    console.log('  📄 news-articles.json     - 新闻文章数据（符合NewsArticle接口）');
    console.log('  📄 featured-news.json     - 推荐文章数据');
    console.log('  📄 news-by-category.json  - 按分类组织的新闻数据');
    console.log('  📄 news-metadata.json     - 网站元数据和统计信息');
  } else {
    console.error('❌ 转换失败');
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = NewsConverter;