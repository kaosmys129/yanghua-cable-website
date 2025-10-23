# WordPress CMS 迁移开发 PRD 文档

## 项目概述

将现有 Strapi CMS 中的 Article 模块完整迁移至 WordPress CMS 系统，实现功能对等、性能优化和无缝切换的企业级解决方案。

### 项目背景
- **当前系统**: Next.js 14 + Strapi Cloud + TypeScript
- **目标系统**: Next.js 14 + WordPress + TypeScript  
- **迁移范围**: Article 内容类型及其完整生态系统
- **业务目标**: 降低 CMS 成本，提升内容管理灵活性，保持用户体验一致性

## 技术架构分析

### 当前 Strapi Article 模块架构

#### 数据模型结构
```typescript
interface Article {
  id: number;
  documentId: string;
  title: string;
  description: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
  cover: MediaObject;
  category: CategoryObject;
  author: AuthorObject;
  blocks: Block[];
}
```

#### 内容块系统
- **RichTextBlock**: 富文本内容
- **QuoteBlock**: 引用块
- **MediaBlock**: 媒体文件
- **SliderBlock**: 图片轮播

#### 前端实现特性
- Next.js App Router 静态生成 (SSG)
- 多语言支持 (i18n)
- SEO 优化和结构化数据
- 草稿模式和预览功能
- 性能监控和错误处理
- 响应式设计和无障碍访问

## 核心需求详细规范

### 1. WordPress 内容类型与字段结构设计

#### 1.1 Custom Post Type 规范
```php
// WordPress Custom Post Type: 'yanghua_article'
register_post_type('yanghua_article', [
    'public' => true,
    'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
    'has_archive' => true,
    'rewrite' => ['slug' => 'articles'],
    'show_in_rest' => true,
    'rest_base' => 'articles',
]);
```

#### 1.2 Advanced Custom Fields (ACF) 字段映射

| Strapi 字段 | WordPress ACF 字段 | 字段类型 | 配置说明 |
|------------|-------------------|---------|----------|
| documentId | document_id | Text | 唯一标识符 |
| description | article_description | Textarea | 文章描述 |
| locale | article_locale | Select | 语言选择 (en/es) |
| cover | article_cover | Image | 封面图片 |
| category | article_category | Taxonomy | 自定义分类法 |
| author | article_author | User | 作者关联 |
| blocks | article_blocks | Flexible Content | 动态内容块 |

#### 1.3 内容块 ACF 配置
```php
// Flexible Content Field: article_blocks
$blocks_config = [
    'rich_text' => [
        'label' => 'Rich Text Block',
        'sub_fields' => [
            'body' => ['type' => 'wysiwyg']
        ]
    ],
    'quote' => [
        'label' => 'Quote Block', 
        'sub_fields' => [
            'title' => ['type' => 'text'],
            'body' => ['type' => 'textarea']
        ]
    ],
    'media' => [
        'label' => 'Media Block',
        'sub_fields' => [
            'file' => ['type' => 'image']
        ]
    ],
    'slider' => [
        'label' => 'Slider Block',
        'sub_fields' => [
            'files' => ['type' => 'gallery']
        ]
    ]
];
```

### 2. WordPress REST API 客户端实现

#### 2.1 API 端点设计
```typescript
// WordPress REST API 端点
const WORDPRESS_ENDPOINTS = {
  articles: '/wp-json/wp/v2/yanghua_article',
  categories: '/wp-json/wp/v2/yanghua_category', 
  authors: '/wp-json/wp/v2/users',
  media: '/wp-json/wp/v2/media',
  health: '/wp-json/wp/v2/health'
};
```

#### 2.2 数据转换器规范
```typescript
interface WordPressToStrapiTransformer {
  transformArticle(wpArticle: WordPressArticle): Article;
  transformBlocks(acfBlocks: ACFBlock[]): Block[];
  transformMedia(wpMedia: WordPressMedia): MediaObject;
  transformCategory(wpCategory: WordPressCategory): CategoryObject;
}
```

#### 2.3 多语言支持实现
- 使用 WPML 或 Polylang 插件
- REST API 语言参数: `?lang=en|es`
- 语言切换逻辑保持与 Strapi 一致

### 3. 前端模板系统重构

#### 3.1 组件更新策略
- **保持现有组件接口**: 不改变 props 结构
- **内部实现适配**: 数据转换在客户端层完成
- **样式完全保持**: CSS/Tailwind 类名不变
- **交互逻辑一致**: 用户体验无感知切换

#### 3.2 关键组件适配清单
```typescript
// 需要适配的核心组件
const COMPONENTS_TO_ADAPT = [
  'BlockRenderer.tsx',           // 内容块渲染器
  'StrapiImage.tsx',            // 图片组件 -> WordPressImage.tsx
  'ArticlesList',               // 文章列表
  'ArticlePage',                // 文章详情页
  'SEOOptimizedLink.tsx'        // SEO 链接组件
];
```

### 4. 数据迁移流程设计

#### 4.1 迁移工具架构
```typescript
interface MigrationTool {
  exportStrapiData(): Promise<StrapiExportData>;
  transformToWordPress(data: StrapiExportData): WordPressImportData;
  importToWordPress(data: WordPressImportData): Promise<MigrationResult>;
  validateMigration(): Promise<ValidationReport>;
}
```

#### 4.2 迁移步骤
1. **数据导出**: 从 Strapi 导出所有 Article 数据
2. **媒体文件处理**: 下载并重新上传到 WordPress
3. **内容转换**: 将 Strapi 格式转换为 WordPress 格式
4. **关联关系重建**: 重新建立分类、作者、媒体关联
5. **URL 映射**: 创建 slug 映射表
6. **数据验证**: 确保迁移完整性

#### 4.3 增量同步机制
```typescript
interface IncrementalSync {
  detectChanges(since: Date): Promise<ChangedArticles>;
  syncChanges(changes: ChangedArticles): Promise<SyncResult>;
  scheduleSync(interval: string): void;
}
```

### 5. URL 路由与 SEO 保障

#### 5.1 URL 结构映射
```nginx
# Nginx 重写规则
location /articles/ {
    try_files $uri $uri/ /index.php?$args;
}

# WordPress .htaccess 规则  
RewriteRule ^articles/([^/]+)/?$ /articles/$1 [L,QSA]
```

#### 5.2 SEO 元数据保持
```typescript
interface SEOMetadata {
  title: string;           // 保持原有标题
  description: string;     // 保持原有描述  
  canonical: string;       // 规范化 URL
  openGraph: OpenGraphData; // 社交媒体标签
  structuredData: JsonLD;   // 结构化数据
}
```

### 6. 性能优化策略

#### 6.1 缓存策略
- **WordPress 对象缓存**: Redis/Memcached
- **CDN 集成**: 媒体文件 CDN 分发
- **API 响应缓存**: 5分钟缓存策略
- **静态生成优化**: ISR (Incremental Static Regeneration)

#### 6.2 性能基准
| 指标 | Strapi 基准 | WordPress 目标 | 测试方法 |
|------|------------|---------------|----------|
| 首页加载时间 | < 2s | < 2s | Lighthouse |
| 文章页面 TTFB | < 800ms | < 800ms | WebPageTest |
| API 响应时间 | < 500ms | < 500ms | 自动化测试 |
| SEO 评分 | 95+ | 95+ | Lighthouse SEO |

## 测试方案

### 1. 自动化测试套件

#### 1.1 单元测试
```typescript
// WordPress 客户端测试
describe('WordPressClient', () => {
  test('getAllArticles returns correct format', async () => {
    const articles = await wordpressClient.getAllArticles('en');
    expect(articles.data).toMatchStrapiFormat();
  });
});
```

#### 1.2 集成测试
```typescript
// 端到端测试
describe('Article Migration E2E', () => {
  test('migrated article displays correctly', async () => {
    await migrateTestArticle();
    const page = await browser.newPage();
    await page.goto('/articles/test-article');
    expect(await page.screenshot()).toMatchSnapshot();
  });
});
```

#### 1.3 性能测试
```typescript
// 性能基准测试
describe('Performance Benchmarks', () => {
  test('API response time under 500ms', async () => {
    const startTime = Date.now();
    await wordpressClient.getAllArticles();
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
  });
});
```

### 2. 兼容性测试矩阵

| 浏览器 | 桌面版本 | 移动版本 | 测试重点 |
|--------|---------|---------|----------|
| Chrome | 120+ | Android | 性能、功能 |
| Safari | 17+ | iOS | 兼容性、渲染 |
| Firefox | 120+ | - | 标准合规 |
| Edge | 120+ | - | 企业兼容 |

## 实施计划

### Phase 1: 基础架构搭建 (Week 1-2)
- [ ] WordPress 环境配置
- [ ] Custom Post Type 和 ACF 设置
- [ ] REST API 端点测试
- [ ] 基础数据转换器开发

### Phase 2: 核心功能开发 (Week 3-4)  
- [ ] WordPress 客户端完整实现
- [ ] 前端组件适配
- [ ] 多语言支持集成
- [ ] 草稿和预览功能

### Phase 3: 数据迁移工具 (Week 5-6)
- [ ] Strapi 数据导出工具
- [ ] WordPress 数据导入脚本  
- [ ] 媒体文件迁移处理
- [ ] 增量同步机制

### Phase 4: 测试与优化 (Week 7-8)
- [ ] 自动化测试套件
- [ ] 性能基准测试
- [ ] 兼容性测试
- [ ] SEO 验证

### Phase 5: 部署与文档 (Week 9-10)
- [ ] 生产环境部署
- [ ] 操作手册编写
- [ ] 性能报告生成
- [ ] 团队培训

## 交付物清单

### 1. 技术交付物
- [ ] **WordPress 定制主题包**
  - Custom Post Type 定义
  - ACF 字段配置文件
  - 主题模板文件 (single-yanghua_article.php 等)

- [ ] **数据迁移工具套件**
  - Strapi 数据导出脚本
  - WordPress 数据导入脚本
  - 媒体文件迁移工具
  - 增量同步服务

- [ ] **前端代码更新**
  - WordPress 客户端实现
  - 数据转换器
  - 组件适配代码
  - 类型定义文件

### 2. 配置文件
- [ ] **环境配置**
  - WordPress 环境变量配置
  - Nginx/Apache 重写规则
  - CDN 配置文件

- [ ] **部署脚本**
  - Docker 容器配置
  - CI/CD 流水线配置
  - 自动化部署脚本

### 3. 文档交付物
- [ ] **技术文档**
  - API 接口文档
  - 数据模型映射文档
  - 架构设计文档

- [ ] **操作手册**
  - WordPress 管理员指南
  - 内容编辑操作手册
  - 故障排除指南

- [ ] **测试报告**
  - 功能测试报告
  - 性能基准报告
  - 兼容性测试报告
  - SEO 优化报告

## 风险评估与应对策略

### 高风险项
1. **数据完整性风险**
   - 风险: 迁移过程中数据丢失或损坏
   - 应对: 多重备份 + 分批迁移 + 回滚机制

2. **性能下降风险**  
   - 风险: WordPress 性能不如 Strapi
   - 应对: 缓存优化 + CDN 加速 + 数据库优化

3. **SEO 影响风险**
   - 风险: URL 变更影响搜索排名
   - 应对: 301 重定向 + sitemap 更新 + 搜索引擎通知

### 中风险项
1. **兼容性问题**
   - 风险: 不同浏览器显示差异
   - 应对: 全面兼容性测试 + polyfill 支持

2. **开发进度风险**
   - 风险: 复杂度超出预期导致延期
   - 应对: 敏捷开发 + 每周里程碑检查

## 成功标准

### 功能完整性 (100%)
- [ ] 所有 Strapi Article 功能在 WordPress 中完全实现
- [ ] 用户界面和交互体验保持一致
- [ ] 多语言支持正常工作
- [ ] 草稿和预览功能正常

### 性能标准 (≥95%)
- [ ] 页面加载时间不超过 Strapi 基准的 105%
- [ ] API 响应时间保持在 500ms 以内
- [ ] Lighthouse 性能评分 ≥ 90
- [ ] Core Web Vitals 全部达标

### SEO 保持 (100%)
- [ ] 所有 URL 正确重定向或保持不变
- [ ] Meta 标签和结构化数据完整迁移
- [ ] 搜索引擎索引状态无负面影响
- [ ] 社交媒体分享功能正常

### 可维护性 (优秀)
- [ ] 代码结构清晰，注释完整
- [ ] 文档齐全，易于理解
- [ ] 测试覆盖率 ≥ 80%
- [ ] 部署流程自动化

---

**文档版本**: v1.0  
**创建日期**: 2024-12-22  
**负责人**: AI Assistant  
**审核状态**: 待审核