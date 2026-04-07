# 阳华STI B2B网站项目开发文档

**文档版本**: v1.0.0  
**创建日期**: 2025-01-15  
**最后更新**: 2025-01-15  
**文档作者**: 项目开发团队  
**项目状态**: 开发中  

---

## 目录

1. [项目概述](#1-项目概述)
2. [后端代码审查报告](#2-后端代码审查报告)
3. [数据模型专项检查](#3-数据模型专项检查)
4. [内容架构迁移说明](#4-内容架构迁移说明)
5. [历史迁移记录](#5-历史迁移记录)
6. [版本控制信息](#6-版本控制信息)
7. [修改记录](#7-修改记录)

---

## 1. 项目概述

### 1.1 项目基本信息

- **项目名称**: 阳华STI B2B网站
- **技术栈**: Next.js 14 + React + TypeScript + Tailwind CSS
- **部署环境**: Vercel
- **开发模式**: Next.js App Router
- **国际化**: next-intl (支持英语、西班牙语)

### 1.2 项目架构

```
yanghua-b2b-website/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── [locale]/        # 国际化路由
│   │   ├── admin/           # 管理后台
│   │   └── api/             # API路由
│   ├── components/          # React组件
│   │   ├── admin/           # 管理组件
│   │   ├── business/        # 业务组件
│   │   ├── features/        # 功能组件
│   │   ├── layout/          # 布局组件
│   │   ├── providers/       # React Query等Provider
│   │   └── ui/              # UI组件
│   ├── lib/                 # 工具库
│   │   ├── content-api.ts   # 内容接口兼容层
│   │   ├── content-repository.ts # 文件内容仓库
│   │   ├── queries.ts       # React Query配置
│   │   └── utils.ts         # 工具函数
│   ├── messages/            # 国际化文件
│   └── types/               # TypeScript类型定义
├── public/                  # 静态资源
│   ├── data/                # JSON数据文件
│   ├── images/              # 图片资源
│   └── videos/              # 视频资源
└── 配置文件
```

### 1.3 文件内容仓库与 Tina CMS

项目当前使用仓库内文件作为内容源，并通过 Tina CMS 提供本地编辑能力：

- **内容目录**: `content/articles`、`content/hubs`、`content/pages`、`content/settings`
- **数据获取**: 服务端通过 `content-repository.ts` 读取文件内容，客户端通过 `/api/articles` 获取文章列表
- **错误处理**: 保留 React Query 与统一错误日志能力
- **性能优化**: 通过 Next.js 缓存和预生成减少运行时开销
- **编辑工作流**: 开发环境使用 Tina，本地文件提交后发布

#### 环境变量配置

```bash
# Next.js Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

---

## 2. 后端代码审查报告

### 2.1 系统架构概述

#### 2.1.1 技术架构

- **前端框架**: Next.js 15.4.4 (App Router)
- **React版本**: 19.1.0
- **TypeScript**: 5.x
- **样式框架**: Tailwind CSS 4.x
- **国际化**: next-intl 4.3.5
- **动画库**: Framer Motion 12.23.12
- **图表库**: Recharts 3.1.0

#### 2.1.2 架构特点

1. **服务端渲染 (SSR)**: 利用Next.js的SSR能力提升SEO和首屏加载速度
2. **静态生成 (SSG)**: 对于静态内容使用SSG优化性能
3. **API路由**: 内置API路由处理后端逻辑
4. **中间件**: 实现国际化路由和请求拦截
5. **模块化设计**: 组件化开发，代码复用性高

### 2.2 核心模块功能说明

#### 2.2.1 国际化模块 (`src/lib/i18n.ts`)

```typescript
// 支持的语言
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// 配置函数
export default getRequestConfig(async ({ locale }) => {
  const activeLocale = (locales.includes(locale as any) ? locale : 'en') as string;
  return {
    locale: activeLocale,
    messages: (await import(`../messages/${activeLocale}.json`)).default
  };
});
```

**功能特点**:
- 支持英语和西班牙语
- 动态加载语言包
- 自动回退到默认语言

#### 2.2.2 中间件模块 (`middleware.ts`)

```typescript
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳过静态资源和API
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || 
      pathname === '/favicon.ico' || /\.[a-zA-Z0-9]{2,5}$/.test(pathname)) {
    return NextResponse.next();
  }
  
  // 根路径重定向到默认语言
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }
  
  return intlMiddleware(request);
}
```

**功能特点**:
- 自动语言路由
- 静态资源跳过处理
- 根路径重定向

#### 2.2.3 错误日志模块 (`src/lib/errorLogger.ts`)

```typescript
class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100;
  
  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, error, context);
    this.addLog(entry);
  }
  
  private async sendToExternalService(entry: ErrorLogEntry) {
    await fetch('/api/logs/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: [entry] })
    });
  }
}
```

**功能特点**:
- 内存日志缓存
- 外部服务上报
- 失败重试机制
- 开发/生产环境区分

### 2.3 API接口规范

#### 2.3.1 错误日志API (`/api/logs/errors`)

**POST /api/logs/errors**

请求格式:
```json
{
  "errors": [
    {
      "id": "string",
      "timestamp": "ISO8601",
      "level": "error|warn|info",
      "message": "string",
      "stack": "string",
      "context": {},
      "userAgent": "string",
      "url": "string",
      "type": "component|api|navigation|unhandled|image|upload|other",
      "severity": "low|medium|high|critical"
    }
  ]
}
```

响应格式:
```json
{
  "success": true,
  "message": "Logs saved successfully",
  "saved": 1
}
```

**GET /api/logs/errors**

查询参数:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 50)
- `level`: 日志级别过滤
- `type`: 日志类型过滤
- `startDate`: 开始日期
- `endDate`: 结束日期

#### 2.3.2 文件监控API (`/api/watch`)

**POST /api/watch**

请求格式:
```json
{
  "enable": true,
  "options": {}
}
```

**GET /api/watch**

响应格式:
```json
{
  "success": true,
  "data": {
    "isWatching": true,
    "watchedPaths": ["path1", "path2"]
  }
}
```

### 2.4 数据库连接配置检查

#### 2.4.1 当前状态

**数据存储方式**: 静态JSON文件
- 项目数据: `public/data/projects_complete_content.json`
- 新闻数据: `public/data/cleaned_news_data_english.json`
- 解决方案数据: `public/data/solutions_complete_content.json`

#### 2.4.2 数据访问模式

```typescript
// 服务端数据读取
export const getNewsArticles = (): NewsArticle[] => {
  const jsonPath = path.join(process.cwd(), 'public', 'cleaned_news_data_english.json');
  const jsonData = fs.readFileSync(jsonPath, 'utf8');
  const newsData = JSON.parse(jsonData);
  return newsData.news.map((item: any, index: number) => ({
    id: (index + 1).toString(),
    title: item.title,
    excerpt: item.summary || '',
    // ... 其他字段映射
  }));
};
```

#### 2.4.3 建议改进

1. **数据库集成**: 建议迁移到PostgreSQL或MongoDB
2. **ORM使用**: 推荐Prisma或Drizzle ORM
3. **缓存策略**: 实现Redis缓存层
4. **数据验证**: 使用Zod进行数据验证

---

## 3. 数据模型专项检查

### 3.1 Projects模块

#### 3.1.1 数据结构分析

**核心数据模型**:
```typescript
interface Project {
  id: string;                    // 项目唯一标识
  title: string;                 // 项目标题
  client: string;                // 客户名称
  industry: string;              // 行业分类
  location: string;              // 项目地点
  duration: string;              // 项目周期
  completionDate: string;        // 完成日期
  projectScale: string;          // 项目规模
  challenge: string;             // 项目挑战
  solution: string;              // 解决方案
  results: Array<{               // 项目成果
    metric: string;
    value: string;
  }>;
  products: string[];            // 使用产品
  images: string[];              // 项目图片
  testimonial?: {                // 客户证言
    text: string;
    author: string;
    position: string;
  };
}
```

#### 3.1.2 字段完整性验证

**必填字段检查**:
- ✅ `id`: 所有项目都有唯一ID
- ✅ `title`: 所有项目都有标题
- ✅ `client`: 客户信息完整
- ✅ `industry`: 行业分类明确
- ✅ `location`: 地理位置信息完整
- ✅ `duration`: 项目周期信息完整
- ✅ `completionDate`: 完成日期格式统一
- ✅ `projectScale`: 项目规模描述完整

**可选字段检查**:
- ⚠️ `testimonial`: 部分项目缺少客户证言
- ⚠️ `images`: 部分项目图片路径需要验证

#### 3.1.3 关系型数据库关联检查

**当前关联关系**:
```
Projects
├── Industry (字符串，建议标准化)
├── Products (数组，建议关联产品表)
├── Images (数组，建议关联媒体表)
└── Testimonials (嵌套对象，建议独立表)
```

**建议数据库设计**:
```sql
-- 项目主表
CREATE TABLE projects (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  client_id INT REFERENCES clients(id),
  industry_id INT REFERENCES industries(id),
  location VARCHAR(100),
  duration VARCHAR(50),
  completion_date DATE,
  project_scale TEXT,
  challenge TEXT,
  solution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 项目成果表
CREATE TABLE project_results (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(50) REFERENCES projects(id),
  metric VARCHAR(100),
  value VARCHAR(100)
);

-- 项目产品关联表
CREATE TABLE project_products (
  project_id VARCHAR(50) REFERENCES projects(id),
  product_id INT REFERENCES products(id),
  PRIMARY KEY (project_id, product_id)
);
```

### 3.2 News模块

#### 3.2.1 内容模型评估

**核心数据模型**:
```typescript
interface NewsArticle {
  id: string;                    // 文章唯一标识
  title: string;                 // 文章标题
  excerpt: string;               // 文章摘要
  content: string;               // 文章内容
  date: string;                  // 发布日期
  readTime: string;              // 阅读时间
  category: string;              // 文章分类
  author: string;                // 作者
  image: string;                 // 封面图片
  featured?: boolean;            // 是否推荐
  tags?: string[];               // 标签
}
```

#### 3.2.2 发布流程审核

**当前发布流程**:
1. 内容创建 → 静态JSON文件
2. 文件上传 → 服务器部署
3. 内容展示 → 前端读取

**存在问题**:
- ❌ 缺少内容审核流程
- ❌ 无版本控制机制
- ❌ 缺少发布状态管理
- ❌ 无内容编辑界面

**建议改进流程**:
```
内容创建 → 草稿保存 → 内容审核 → 发布审批 → 正式发布 → 内容归档
```

#### 3.2.3 分类系统验证

**当前分类**:
- Company News (公司新闻)
- Industry Trends (行业趋势)
- Technical Articles (技术文章)

**标签系统**:
- New Product Launch (新产品发布)
- Technological Innovation (技术创新)
- New Energy (新能源)
- Data Center (数据中心)
- Policy Interpretation (政策解读)

**建议优化**:
```sql
-- 分类表
CREATE TABLE news_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  parent_id INT REFERENCES news_categories(id)
);

-- 标签表
CREATE TABLE news_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE,
  color VARCHAR(7) -- HEX颜色代码
);

-- 文章标签关联表
CREATE TABLE news_article_tags (
  article_id VARCHAR(50) REFERENCES news_articles(id),
  tag_id INT REFERENCES news_tags(id),
  PRIMARY KEY (article_id, tag_id)
);
```

---

## 4. Strapi CMS集成准备方案

### 4.1 Strapi CMS架构概述

#### 4.1.1 无头CMS架构

**Strapi作为后端CMS**:
1. 内容管理和API提供
2. 用户权限和角色管理
3. 多媒体资源管理
4. 内容发布工作流

**架构特点**:
- RESTful API和GraphQL支持
- 自定义内容类型
- 插件生态系统
- 多环境部署支持

#### 4.1.2 与Next.js集成优势

**集成优势**:
1. **API驱动**: 通过REST API无缝集成
2. **内容管理**: 可视化内容编辑界面
3. **权限控制**: 基于角色的访问控制
4. **媒体管理**: 集成文件上传和媒体库

### 4.2 内容类型设计

#### 4.2.1 Projects内容类型

```json
{
  "title": "Text",
  "client": "Text", 
  "industry": "Text",
  "location": "Text",
  "duration": "Text",
  "completionDate": "Date",
  "projectScale": "Text",
  "challenges": "Rich Text",
  "solutions": "Rich Text",
  "outcomes": "Rich Text",
  "products": "Relation (many-to-many)",
  "images": "Media (multiple)",
  "testimonial": "Component"
}
```

#### 4.2.2 News内容类型

```json
{
  "title": "Text",
  "summary": "Text",
  "content": "Rich Text",
  "author": "Text",
  "publishedAt": "DateTime",
  "featuredImage": "Media (single)",
  "category": "Relation (many-to-one)",
  "tags": "Relation (many-to-many)",
  "isFeatured": "Boolean"
}
```

#### 4.2.3 API集成示例

```typescript
// 获取项目数据
export async function getProjects() {
  const response = await fetch('http://localhost:1337/api/projects?populate=*');
  const data = await response.json();
  return data.data;
}

// 获取新闻文章
export async function getNewsArticles() {
  const response = await fetch('http://localhost:1337/api/articles?populate=*');
  const data = await response.json();
  return data.data;
}

// 创建新内容
export async function createProject(projectData: any) {
  const response = await fetch('http://localhost:1337/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: projectData })
  });
  return response.json();
}
```

### 4.3 认证与权限配置

#### 4.3.1 JWT认证机制

```typescript
// 用户登录
export async function loginUser(email: string, password: string) {
  const response = await fetch('http://localhost:1337/api/auth/local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password })
  });
  return response.json();
}

// 使用JWT进行API调用
export async function getProtectedContent(jwt: string) {
  const response = await fetch('http://localhost:1337/api/protected-content', {
    headers: { 'Authorization': `Bearer ${jwt}` }
  });
  return response.json();
}
```

#### 4.3.2 角色权限设置

**权限级别**:
- **管理员**: 完全的CRUD权限
- **编辑者**: 内容创建和编辑权限
- **审核者**: 内容审核和发布权限
- **公开访问**: 只读权限用于前端展示

#### 4.3.3 环境变量配置

**步骤1: 获取Strapi API令牌**

1. 访问Strapi管理面板: http://localhost:1337/admin
2. 登录管理员账户
3. 导航到 "Settings" → "API Tokens"
4. 点击 "Create new API Token"
5. 配置令牌信息：
   - **Name**: `Frontend Integration Token`
   - **Description**: `用于前端数据获取和迁移脚本的API令牌`
   - **Token duration**: `Unlimited` (推荐) 或设置合适的过期时间
   - **Token type**: `Read-only` (用于数据获取) 或 `Full access` (用于数据迁移)
6. 点击 "Save" 生成令牌
7. **重要**: 复制生成的令牌并安全保存，令牌只会显示一次

**步骤2: 配置环境变量**

```bash
# .env.local
# Strapi API配置
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=c62d4b5865e79b88fb49d90d32cb23806c80a827916010b89841a56a7bcd0ac154a8a32e3f130f9ae170295493aaec88d99ec84f237b62a269078dcf561b78c38d2ec7f084b601a06586a8c81d63021e44e9f5532c71b3283eebe3c706babc7a32147648c4f6560e9897fbee74ff72a5e2c8152dda91a6c66e80fb04a7ca766b
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337

# 数据迁移配置
ENABLE_STRAPI=true

# Webhook安全配置
STRAPI_WEBHOOK_SECRET=your_webhook_secret_here

# 重新验证令牌
REVALIDATE_TOKEN=your-secret-revalidate-token
```

**步骤3: 验证API连接**

```bash
# 测试API连接
curl -H "Authorization: Bearer your_actual_api_token_here" \
     http://localhost:1337/api/users/me
```

**令牌权限配置建议**:

- **开发环境**: 使用 `Full access` 令牌便于开发和测试
- **生产环境**: 根据最小权限原则，为不同用途创建不同权限的令牌
  - 前端数据获取: `Read-only` 权限
  - 数据迁移脚本: `Full access` 权限（临时使用）
  - Webhook集成: 自定义权限

### 4.4 部署与环境配置

#### 4.4.1 本地开发环境

**步骤1: 安装Strapi**
```bash
npx create-strapi@latest backend --quickstart
cd backend && npm run develop
```

**步骤2: 配置内容类型**
- 访问 http://localhost:1337/admin
- 创建管理员账户
- 定义内容类型和字段

**步骤3: Next.js集成**
```typescript
// lib/strapi.ts
const STRAPI_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';

export async function fetchAPI(endpoint: string, options = {}) {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options as any).headers,
    },
    ...options,
  });
  return response.json();
}
```

#### 4.4.2 生产环境配置

**数据库配置**:
- PostgreSQL或MySQL
- 环境变量管理
- 连接池配置

**部署选项**:
- Heroku
- DigitalOcean
- AWS EC2
- Railway

#### 4.4.3 数据迁移策略

```typescript
// 项目数据迁移示例
export async function migrateProjects() {
  const existingProjects = require('./public/data/projects_complete_content.json');
  
  for (const project of existingProjects.projects) {
    await fetch('http://localhost:1337/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: project })
    });
  }
}

// 新闻数据迁移
export async function migrateNews() {
  const existingNews = require('./public/data/cleaned_news_data_english.json');
  
  for (const article of existingNews.news) {
    await fetch('http://localhost:1337/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: article })
    });
  }
}
```

---

## 5. 版本控制信息

### 5.1 Git配置

**仓库信息**:
- 主分支: `main`
- 开发分支: `develop`
- 功能分支: `feature/*`
- 修复分支: `hotfix/*`

**提交规范**:
```
type(scope): description

feat(auth): add user authentication
fix(api): resolve payment processing issue
docs(readme): update installation guide
style(ui): improve button styling
refactor(utils): optimize data processing
test(payment): add stripe integration tests
```

### 5.2 版本发布

**版本号规则**: 语义化版本 (Semantic Versioning)
- 主版本号: 不兼容的API修改
- 次版本号: 向下兼容的功能性新增
- 修订号: 向下兼容的问题修正

**当前版本**: v0.1.0 (开发版本)

---

## 6. 修改记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| v1.0.0 | 2025-01-15 | 初始文档创建，包含完整的项目分析和技术规范 | 项目开发团队 |

---

## 附录

### A. 技术债务清单

1. **数据存储**: 从静态JSON迁移到数据库
2. **图片管理**: 实现动态图片上传和管理
3. **内容管理**: 开发CMS管理界面
4. **性能优化**: 实现缓存策略
5. **测试覆盖**: 增加单元测试和集成测试

### B. 安全检查清单

- [ ] API端点安全验证
- [ ] 用户输入验证和清理
- [ ] HTTPS强制使用
- [ ] 敏感信息加密存储
- [ ] 访问日志记录
- [ ] 错误信息脱敏

### C. 性能优化建议

1. **图片优化**: 使用WebP格式，实现懒加载
2. **代码分割**: 按路由分割代码包
3. **缓存策略**: 实现多级缓存
4. **CDN部署**: 静态资源CDN加速
5. **数据库优化**: 索引优化和查询优化

---

## 7. 后续开发ToDo清单

### 7.1 Strapi内容模型及数据准备

#### 7.1.1 内容模型创建

**Projects内容模型**:
```javascript
// Strapi Content Type: Projects
{
  "kind": "collectionType",
  "collectionName": "projects",
  "info": {
    "singularName": "project",
    "pluralName": "projects",
    "displayName": "Project"
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 200
    },
    "client": {
      "type": "string",
      "required": true
    },
    "industry": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::industry.industry"
    },
    "location": {
      "type": "string"
    },
    "duration": {
      "type": "string"
    },
    "completionDate": {
      "type": "date"
    },
    "projectScale": {
      "type": "text"
    },
    "challenge": {
      "type": "richtext"
    },
    "solution": {
      "type": "richtext"
    },
    "results": {
      "type": "component",
      "repeatable": true,
      "component": "project.result"
    },
    "products": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::product.product"
    },
    "images": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images"]
    },
    "testimonial": {
      "type": "component",
      "component": "project.testimonial"
    },
    "slug": {
      "type": "uid",
      "targetField": "title"
    },
    "featured": {
      "type": "boolean",
      "default": false
    }
  }
}
```

**News内容模型**:
```javascript
// Strapi Content Type: Articles
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article"
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 200
    },
    "summary": {
      "type": "text",
      "maxLength": 500
    },
    "content": {
      "type": "richtext",
      "required": true
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::author.author"
    },
    "publishedAt": {
      "type": "datetime"
    },
    "featuredImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category"
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag"
    },
    "isFeatured": {
      "type": "boolean",
      "default": false
    },
    "slug": {
      "type": "uid",
      "targetField": "title"
    },
    "readTime": {
      "type": "integer",
      "min": 1
    },
    "seo": {
      "type": "component",
      "component": "shared.seo"
    }
  }
}
```

#### 7.1.2 数据迁移执行步骤

**前置条件检查**:
1. ✅ Strapi服务正在运行 (http://localhost:1337/admin)
2. ✅ 已创建管理员账户并能正常登录
3. ✅ 已生成API令牌并配置到环境变量
4. ✅ 已在Strapi中创建相应的内容类型

**执行数据迁移**:

```bash
# 1. 确保环境变量已正确配置
echo $STRAPI_API_TOKEN  # 应该显示你的API令牌

# 2. 执行项目数据迁移
npm run migrate:projects

# 3. 执行新闻数据迁移
npm run migrate:news

# 4. 验证迁移结果
curl -H "Authorization: Bearer $STRAPI_API_TOKEN" \
     "http://localhost:1337/api/projects?pagination[pageSize]=5"
```

**故障排除指南**:

| 错误类型 | 可能原因 | 解决方案 |
|---------|---------|----------|
| `401 Unauthorized` | API令牌无效或未配置 | 重新生成令牌并更新环境变量 |
| `404 Not Found` | 内容类型不存在 | 在Strapi管理面板中创建对应的内容类型 |
| `400 Bad Request` | 数据格式不匹配 | 检查数据结构是否与Strapi内容类型匹配 |
| `Connection refused` | Strapi服务未运行 | 启动Strapi服务: `cd backend && npm run develop` |
| `ENOENT` | 数据文件不存在 | 确认JSON数据文件路径正确 |

**项目数据迁移脚本**:
```typescript
// scripts/migrate-projects.ts
import fs from 'fs';
import path from 'path';

interface LegacyProject {
  id: string;
  title: string;
  client: string;
  industry: string;
  location: string;
  duration: string;
  completionDate: string;
  projectScale: string;
  challenge: string;
  solution: string;
  results: Array<{ metric: string; value: string }>;
  products: string[];
  images: string[];
  testimonial?: {
    text: string;
    author: string;
    position: string;
  };
}

export async function migrateProjectsToStrapi() {
  const STRAPI_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
  const API_TOKEN = process.env.STRAPI_API_TOKEN;
  
  // 读取现有项目数据
  const projectsPath = path.join(process.cwd(), 'public/data/projects_complete_content.json');
  const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
  
  for (const project of projectsData.projects) {
    try {
      // 1. 创建或获取行业分类
      const industry = await createOrGetIndustry(project.industry);
      
      // 2. 创建或获取产品关联
      const products = await createOrGetProducts(project.products);
      
      // 3. 上传项目图片
      const uploadedImages = await uploadProjectImages(project.images);
      
      // 4. 创建项目记录
      const projectData = {
        data: {
          title: project.title,
          client: project.client,
          industry: industry.id,
          location: project.location,
          duration: project.duration,
          completionDate: project.completionDate,
          projectScale: project.projectScale,
          challenge: project.challenge,
          solution: project.solution,
          results: project.results,
          products: products.map(p => p.id),
          images: uploadedImages.map(img => img.id),
          testimonial: project.testimonial,
          slug: generateSlug(project.title),
          featured: false
        }
      };
      
      const response = await fetch(`${STRAPI_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create project: ${project.title}`);
      }
      
      console.log(`✅ Migrated project: ${project.title}`);
    } catch (error) {
      console.error(`❌ Failed to migrate project: ${project.title}`, error);
    }
  }
}

async function createOrGetIndustry(industryName: string) {
  // 实现行业分类的创建或获取逻辑
}

async function createOrGetProducts(productNames: string[]) {
  // 实现产品的创建或获取逻辑
}

async function uploadProjectImages(imagePaths: string[]) {
  // 实现图片上传逻辑
}

function generateSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}
```

**新闻数据迁移**:
```typescript
// scripts/migrate-news.ts
export async function migrateNewsToStrapi() {
  const STRAPI_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
  const API_TOKEN = process.env.STRAPI_API_TOKEN;
  
  // 读取现有新闻数据
  const newsPath = path.join(process.cwd(), 'public/data/cleaned_news_data_english.json');
  const newsData = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
  
  for (const article of newsData.news) {
    try {
      // 1. 创建或获取分类
      const category = await createOrGetCategory(article.category);
      
      // 2. 创建或获取标签
      const tags = await createOrGetTags(article.tags || []);
      
      // 3. 创建或获取作者
      const author = await createOrGetAuthor(article.author);
      
      // 4. 上传特色图片
      const featuredImage = await uploadFeaturedImage(article.image);
      
      // 5. 创建文章记录
      const articleData = {
        data: {
          title: article.title,
          summary: article.summary || article.excerpt,
          content: article.content,
          author: author.id,
          publishedAt: article.date,
          featuredImage: featuredImage?.id,
          category: category.id,
          tags: tags.map(t => t.id),
          isFeatured: article.featured || false,
          slug: generateSlug(article.title),
          readTime: calculateReadTime(article.content),
          seo: {
            metaTitle: article.title,
            metaDescription: article.summary || article.excerpt,
            keywords: article.tags?.join(', ')
          }
        }
      };
      
      const response = await fetch(`${STRAPI_URL}/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify(articleData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create article: ${article.title}`);
      }
      
      console.log(`✅ Migrated article: ${article.title}`);
    } catch (error) {
      console.error(`❌ Failed to migrate article: ${article.title}`, error);
    }
  }
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
```

### 7.2 前端数据源改造

#### 7.2.1 API客户端封装

```typescript
// lib/strapi-client.ts
class StrapiClient {
  private baseURL: string;
  private apiToken?: string;
  
  constructor(baseURL: string, apiToken?: string) {
    this.baseURL = baseURL;
    this.apiToken = apiToken;
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.apiToken) {
      headers.Authorization = `Bearer ${this.apiToken}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // 项目相关API
  async getProjects(params?: {
    populate?: string;
    filters?: Record<string, any>;
    sort?: string;
    pagination?: { page: number; pageSize: number };
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.populate) searchParams.set('populate', params.populate);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        searchParams.set(`filters[${key}]`, value);
      });
    }
    if (params?.pagination) {
      searchParams.set('pagination[page]', params.pagination.page.toString());
      searchParams.set('pagination[pageSize]', params.pagination.pageSize.toString());
    }
    
    return this.request(`/projects?${searchParams.toString()}`);
  }
  
  async getProject(id: string, populate = '*') {
    return this.request(`/projects/${id}?populate=${populate}`);
  }
  
  async getProjectBySlug(slug: string, populate = '*') {
    return this.request(`/projects?filters[slug][$eq]=${slug}&populate=${populate}`);
  }
  
  // 新闻相关API
  async getArticles(params?: {
    populate?: string;
    filters?: Record<string, any>;
    sort?: string;
    pagination?: { page: number; pageSize: number };
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.populate) searchParams.set('populate', params.populate);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        searchParams.set(`filters[${key}]`, value);
      });
    }
    if (params?.pagination) {
      searchParams.set('pagination[page]', params.pagination.page.toString());
      searchParams.set('pagination[pageSize]', params.pagination.pageSize.toString());
    }
    
    return this.request(`/articles?${searchParams.toString()}`);
  }
  
  async getArticle(id: string, populate = '*') {
    return this.request(`/articles/${id}?populate=${populate}`);
  }
  
  async getArticleBySlug(slug: string, populate = '*') {
    return this.request(`/articles?filters[slug][$eq]=${slug}&populate=${populate}`);
  }
  
  async getFeaturedArticles(limit = 3) {
    return this.request(`/articles?filters[isFeatured][$eq]=true&pagination[pageSize]=${limit}&populate=*`);
  }
}

// 创建客户端实例
export const strapiClient = new StrapiClient(
  process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337',
  process.env.STRAPI_API_TOKEN
);
```

#### 7.2.2 数据获取函数重构

```typescript
// lib/data/projects.ts
import { strapiClient } from '../strapi-client';
import { Project } from '@/types/project';

// 替换原有的静态数据获取
export async function getProjects(): Promise<Project[]> {
  try {
    const response = await strapiClient.getProjects({
      populate: 'industry,products,images,testimonial',
      sort: 'completionDate:desc'
    });
    
    return response.data.map(transformStrapiProject);
  } catch (error) {
    console.error('Failed to fetch projects from Strapi:', error);
    // 降级到静态数据
    return getFallbackProjects();
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const response = await strapiClient.getProject(id, '*');
    return transformStrapiProject(response.data);
  } catch (error) {
    console.error(`Failed to fetch project ${id} from Strapi:`, error);
    return null;
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const response = await strapiClient.getProjectBySlug(slug, '*');
    return response.data.length > 0 ? transformStrapiProject(response.data[0]) : null;
  } catch (error) {
    console.error(`Failed to fetch project with slug ${slug} from Strapi:`, error);
    return null;
  }
}

function transformStrapiProject(strapiProject: any): Project {
  return {
    id: strapiProject.id.toString(),
    title: strapiProject.attributes.title,
    client: strapiProject.attributes.client,
    industry: strapiProject.attributes.industry?.data?.attributes?.name || '',
    location: strapiProject.attributes.location,
    duration: strapiProject.attributes.duration,
    completionDate: strapiProject.attributes.completionDate,
    projectScale: strapiProject.attributes.projectScale,
    challenge: strapiProject.attributes.challenge,
    solution: strapiProject.attributes.solution,
    results: strapiProject.attributes.results || [],
    products: strapiProject.attributes.products?.data?.map((p: any) => p.attributes.name) || [],
    images: strapiProject.attributes.images?.data?.map((img: any) => img.attributes.url) || [],
    testimonial: strapiProject.attributes.testimonial,
    slug: strapiProject.attributes.slug
  };
}

// 降级函数，当Strapi不可用时使用静态数据
function getFallbackProjects(): Project[] {
  // 保留原有的静态数据读取逻辑作为降级方案
  const fs = require('fs');
  const path = require('path');
  const projectsPath = path.join(process.cwd(), 'public/data/projects_complete_content.json');
  const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
  return projectsData.projects;
}
```

```typescript
// lib/data/news.ts
import { strapiClient } from '../strapi-client';
import { NewsArticle } from '@/types/news';

export async function getNewsArticles(): Promise<NewsArticle[]> {
  try {
    const response = await strapiClient.getArticles({
      populate: 'author,category,tags,featuredImage',
      sort: 'publishedAt:desc'
    });
    
    return response.data.map(transformStrapiArticle);
  } catch (error) {
    console.error('Failed to fetch articles from Strapi:', error);
    return getFallbackNews();
  }
}

export async function getFeaturedArticles(): Promise<NewsArticle[]> {
  try {
    const response = await strapiClient.getFeaturedArticles(3);
    return response.data.map(transformStrapiArticle);
  } catch (error) {
    console.error('Failed to fetch featured articles from Strapi:', error);
    return [];
  }
}

export async function getArticle(id: string): Promise<NewsArticle | null> {
  try {
    const response = await strapiClient.getArticle(id, '*');
    return transformStrapiArticle(response.data);
  } catch (error) {
    console.error(`Failed to fetch article ${id} from Strapi:`, error);
    return null;
  }
}

function transformStrapiArticle(strapiArticle: any): NewsArticle {
  return {
    id: strapiArticle.id.toString(),
    title: strapiArticle.attributes.title,
    excerpt: strapiArticle.attributes.summary,
    content: strapiArticle.attributes.content,
    date: strapiArticle.attributes.publishedAt,
    readTime: `${strapiArticle.attributes.readTime || 5} min read`,
    category: strapiArticle.attributes.category?.data?.attributes?.name || '',
    author: strapiArticle.attributes.author?.data?.attributes?.name || '',
    image: strapiArticle.attributes.featuredImage?.data?.attributes?.url || '',
    featured: strapiArticle.attributes.isFeatured,
    tags: strapiArticle.attributes.tags?.data?.map((tag: any) => tag.attributes.name) || [],
    slug: strapiArticle.attributes.slug
  };
}

function getFallbackNews(): NewsArticle[] {
  // 降级到静态数据
  const fs = require('fs');
  const path = require('path');
  const newsPath = path.join(process.cwd(), 'public/data/cleaned_news_data_english.json');
  const newsData = JSON.parse(fs.readFileSync(newsPath, 'utf8'));
  return newsData.news.map((item: any, index: number) => ({
    id: (index + 1).toString(),
    title: item.title,
    excerpt: item.summary || '',
    content: item.content,
    date: item.date,
    readTime: item.readTime || '5 min read',
    category: item.category,
    author: item.author,
    image: item.image,
    featured: index === 0,
    tags: item.tags || []
  }));
}
```

### 7.3 渲染策略优化

#### 7.3.1 渲染策略选择

**ISR (Incremental Static Regeneration) - 推荐策略**:
```typescript
// app/[locale]/projects/page.tsx
import { getProjects } from '@/lib/data/projects';

export const revalidate = 3600; // 1小时重新验证

export default async function ProjectsPage() {
  const projects = await getProjects();
  
  return (
    <div>
      {/* 项目列表渲染 */}
    </div>
  );
}

// 为动态路由生成静态参数
export async function generateStaticParams() {
  const projects = await getProjects();
  
  return projects.map((project) => ({
    id: project.id,
  }));
}
```

**SSR策略 (用于实时性要求高的页面)**:
```typescript
// app/[locale]/news/page.tsx
import { getNewsArticles, getFeaturedArticles } from '@/lib/data/news';

// 强制SSR
export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const [articles, featuredArticles] = await Promise.all([
    getNewsArticles(),
    getFeaturedArticles()
  ]);
  
  return (
    <div>
      {/* 新闻列表渲染 */}
    </div>
  );
}
```

**客户端渲染策略 (用于交互性强的组件)**:
```typescript
// components/news/NewsSearch.tsx
'use client';

import { useState, useEffect } from 'react';
import { strapiClient } from '@/lib/strapi-client';

export function NewsSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (searchTerm.length > 2) {
      searchArticles(searchTerm);
    }
  }, [searchTerm]);
  
  const searchArticles = async (term: string) => {
    setLoading(true);
    try {
      const response = await strapiClient.getArticles({
        filters: {
          title: { $containsi: term }
        },
        populate: 'featuredImage,category'
      });
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* 搜索界面 */}
    </div>
  );
}
```

#### 7.3.2 构建时数据预取

```typescript
// scripts/prebuild-data.ts
import { strapiClient } from '../lib/strapi-client';
import fs from 'fs';
import path from 'path';

/**
 * 构建时预取关键数据，生成静态缓存文件
 */
export async function prebuildData() {
  console.log('🚀 Starting data prebuild...');
  
  try {
    // 1. 预取所有项目数据
    const projects = await strapiClient.getProjects({
      populate: '*',
      pagination: { page: 1, pageSize: 100 }
    });
    
    // 2. 预取所有新闻文章
    const articles = await strapiClient.getArticles({
      populate: '*',
      pagination: { page: 1, pageSize: 100 }
    });
    
    // 3. 预取特色内容
    const featuredArticles = await strapiClient.getFeaturedArticles(5);
    
    // 4. 生成静态缓存文件
    const cacheDir = path.join(process.cwd(), '.next/cache/strapi');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(cacheDir, 'projects.json'),
      JSON.stringify(projects, null, 2)
    );
    
    fs.writeFileSync(
      path.join(cacheDir, 'articles.json'),
      JSON.stringify(articles, null, 2)
    );
    
    fs.writeFileSync(
      path.join(cacheDir, 'featured-articles.json'),
      JSON.stringify(featuredArticles, null, 2)
    );
    
    console.log('✅ Data prebuild completed successfully');
    console.log(`📊 Cached ${projects.data.length} projects`);
    console.log(`📰 Cached ${articles.data.length} articles`);
    
  } catch (error) {
    console.error('❌ Data prebuild failed:', error);
    process.exit(1);
  }
}

// 在package.json中添加脚本
// "prebuild": "tsx scripts/prebuild-data.ts",
// "build": "npm run prebuild && next build"
```

#### 7.3.3 部分静态化实现

```typescript
// lib/cache/static-cache.ts
import fs from 'fs';
import path from 'path';

class StaticCache {
  private cacheDir: string;
  
  constructor() {
    this.cacheDir = path.join(process.cwd(), '.next/cache/strapi');
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        // 检查缓存是否过期 (1小时)
        const now = Date.now();
        const cacheTime = parsed.timestamp || 0;
        const maxAge = 60 * 60 * 1000; // 1小时
        
        if (now - cacheTime < maxAge) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.error(`Failed to read cache for key: ${key}`, error);
    }
    
    return null;
  }
  
  async set<T>(key: string, data: T): Promise<void> {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      
      const cacheData = {
        timestamp: Date.now(),
        data
      };
      
      const filePath = path.join(this.cacheDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error(`Failed to write cache for key: ${key}`, error);
    }
  }
  
  async invalidate(key: string): Promise<void> {
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to invalidate cache for key: ${key}`, error);
    }
  }
}

export const staticCache = new StaticCache();

// 使用缓存的数据获取函数
export async function getCachedProjects() {
  let projects = await staticCache.get('projects');
  
  if (!projects) {
    projects = await strapiClient.getProjects({ populate: '*' });
    await staticCache.set('projects', projects);
  }
  
  return projects;
}
```

### 7.4 迁移与维护

#### 7.4.1 渐进式迁移策略

**阶段1: 双数据源并行 (2周)**
```typescript
// lib/data/hybrid-data.ts
export async function getProjectsHybrid(): Promise<Project[]> {
  const useStrapi = process.env.ENABLE_STRAPI === 'true';
  
  if (useStrapi) {
    try {
      return await getStrapiProjects();
    } catch (error) {
      console.warn('Strapi unavailable, falling back to static data');
      return getStaticProjects();
    }
  }
  
  return getStaticProjects();
}
```

**阶段2: 数据一致性验证 (1周)**
```typescript
// scripts/validate-data-consistency.ts
export async function validateDataConsistency() {
  const staticProjects = getStaticProjects();
  const strapiProjects = await getStrapiProjects();
  
  const inconsistencies = [];
  
  for (const staticProject of staticProjects) {
    const strapiProject = strapiProjects.find(p => p.id === staticProject.id);
    
    if (!strapiProject) {
      inconsistencies.push(`Missing project in Strapi: ${staticProject.id}`);
      continue;
    }
    
    // 验证关键字段
    if (staticProject.title !== strapiProject.title) {
      inconsistencies.push(`Title mismatch for project ${staticProject.id}`);
    }
    
    if (staticProject.client !== strapiProject.client) {
      inconsistencies.push(`Client mismatch for project ${staticProject.id}`);
    }
  }
  
  if (inconsistencies.length > 0) {
    console.error('Data inconsistencies found:', inconsistencies);
    process.exit(1);
  }
  
  console.log('✅ Data consistency validation passed');
}
```

**阶段3: 完全切换到Strapi (1周)**
```typescript
// 移除静态数据依赖，完全使用Strapi API
export const getProjects = getStrapiProjects;
export const getNewsArticles = getStrapiArticles;
```

#### 7.4.2 内容持续更新机制

**Webhook集成**:
```typescript
// app/api/webhooks/strapi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, entry } = body;
    
    // 验证webhook签名
    const signature = request.headers.get('x-strapi-signature');
    if (!verifyWebhookSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // 根据内容类型重新验证相关页面
    switch (model) {
      case 'project':
        await revalidateTag('projects');
        await revalidatePath('/[locale]/projects');
        await revalidatePath(`/[locale]/projects/${entry.slug}`);
        break;
        
      case 'article':
        await revalidateTag('articles');
        await revalidatePath('/[locale]/news');
        await revalidatePath(`/[locale]/news/${entry.slug}`);
        break;
    }
    
    // 清除静态缓存
    await staticCache.invalidate(model + 's');
    
    console.log(`✅ Revalidated content for ${model}: ${entry.id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function verifyWebhookSignature(signature: string | null, body: any): boolean {
  // 实现webhook签名验证逻辑
  const expectedSignature = generateSignature(body);
  return signature === expectedSignature;
}
```

**自动化内容同步**:
```typescript
// scripts/sync-content.ts
import cron from 'node-cron';

// 每小时同步一次内容
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Starting content sync...');
  
  try {
    // 1. 获取最新内容
    const latestProjects = await strapiClient.getProjects({
      populate: '*',
      sort: 'updatedAt:desc',
      pagination: { page: 1, pageSize: 10 }
    });
    
    const latestArticles = await strapiClient.getArticles({
      populate: '*',
      sort: 'updatedAt:desc',
      pagination: { page: 1, pageSize: 10 }
    });
    
    // 2. 更新缓存
    await staticCache.set('latest-projects', latestProjects);
    await staticCache.set('latest-articles', latestArticles);
    
    // 3. 触发增量静态重新生成
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.REVALIDATE_TOKEN}` },
      body: JSON.stringify({ paths: ['/projects', '/news'] })
    });
    
    console.log('✅ Content sync completed');
  } catch (error) {
    console.error('❌ Content sync failed:', error);
  }
});
```

#### 7.4.3 监控和错误处理

```typescript
// lib/monitoring/strapi-monitor.ts
class StrapiMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy = true;
  
  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await fetch(`${process.env.STRAPI_API_URL}/api/health`);
        this.isHealthy = response.ok;
        
        if (!this.isHealthy) {
          console.warn('⚠️ Strapi health check failed');
          // 发送告警通知
          await this.sendAlert('Strapi health check failed');
        }
      } catch (error) {
        this.isHealthy = false;
        console.error('❌ Strapi health check error:', error);
        await this.sendAlert(`Strapi health check error: ${error.message}`);
      }
    }, 60000); // 每分钟检查一次
  }
  
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  getHealthStatus() {
    return this.isHealthy;
  }
  
  private async sendAlert(message: string) {
    // 实现告警通知逻辑 (邮件、Slack、钉钉等)
    console.log(`🚨 Alert: ${message}`);
  }
}

export const strapiMonitor = new StrapiMonitor();
```

### 7.5 技术选型说明

#### 7.5.1 Strapi版本选择
- **推荐版本**: Strapi v4.x (最新稳定版)
- **数据库**: PostgreSQL (生产环境) / SQLite (开发环境)
- **文件存储**: Cloudinary 或 AWS S3
- **部署平台**: Railway、Heroku 或 DigitalOcean

#### 7.5.2 性能优化策略
- **CDN**: 使用Vercel Edge Network或Cloudflare
- **图片优化**: Next.js Image组件 + Strapi图片处理
- **缓存策略**: 多层缓存 (浏览器、CDN、应用层)
- **数据库优化**: 索引优化、查询优化

#### 7.5.3 安全考虑
- **API安全**: JWT认证、CORS配置、速率限制
- **数据验证**: Strapi内置验证 + 前端验证
- **环境隔离**: 开发、测试、生产环境分离
- **备份策略**: 定期数据库备份、文件备份

---

## 5. WordPress CMS迁移记录

### 5.1 迁移概述

**迁移时间**: 2025-09-06 00:02:00  
**迁移范围**: 新闻和项目JSON数据从Strapi CMS迁移至WordPress CMS  
**迁移状态**: 进行中  
**负责人**: 项目开发团队  

### 5.2 数据准备阶段

#### 5.2.1 数据完整性检查

**检查时间**: 2025-09-06 00:02:31  
**检查结果**: 

| 文件名 | 状态 | 大小 | 数据项 | 备注 |
|--------|------|------|--------|---------|
| projects_complete_content.json | ✅ 有效 | 10.75 KB | 7个项目 | 项目数据完整 |
| merged_news_with_content.json | ✅ 有效 | 83.60 KB | 67条新闻 | 新闻数据完整 |
| cleaned_news_data_english.json | ✅ 有效 | 27.61 KB | 67条新闻 | 英文新闻数据 |
| cleaned_news_data_spanish.json | ✅ 有效 | 20.62 KB | 47条新闻 | 西班牙语新闻数据(已修复JSON语法错误) |
| yanghuasti_news_formatted.json | ✅ 有效 | 83.06 KB | 67条新闻 | 格式化新闻数据 |

**数据统计总计**:
- 文件总数: 5个
- 有效文件: 5个 (100%)
- 数据项总数: 255个
- 项目数据: 7个
- 新闻数据: 248条 (多语言)

#### 5.2.2 数据质量验证

**验证项目**:
- ✅ JSON格式验证: 所有文件格式正确
- ✅ 必需字段检查: 项目和新闻数据字段完整
- ✅ 数据类型验证: 日期格式、字符串长度等符合要求
- ✅ 关联性检查: 数据间关联关系正确
- ✅ 编码检查: UTF-8编码正确，支持多语言字符

**发现并修复的问题**:
1. `cleaned_news_data_spanish.json` 存在JSON语法错误 (多余逗号) - 已修复
2. 部分新闻条目缺少content字段 - 已标记，使用summary作为备选

### 5.3 WordPress安装配置

#### 5.3.1 系统要求
- PHP 7.4+
- MySQL 5.7+ 或 MariaDB 10.3+
- Apache 或 Nginx
- 最小内存: 512MB

#### 5.3.2 安装脚本
创建了自动化安装脚本: `scripts/wordpress-setup.sh`
- 自动下载WordPress最新版本
- 创建数据库和用户
- 生成安全配置
- 启动开发服务器

#### 5.3.3 迁移工具
开发了专用迁移脚本: `scripts/wordpress-data-migration.ts`
- 支持批量数据导入
- 自动处理数据格式转换
- 错误处理和重试机制
- 生成详细迁移报告

### 5.4 数据迁移执行

#### 5.4.1 迁移策略
- **分批处理**: 避免服务器负载过高
- **错误恢复**: 支持断点续传和错误重试
- **数据验证**: 每批数据迁移后进行完整性检查
- **回滚机制**: 保留原始数据，支持快速回滚

#### 5.4.2 字段映射关系

**项目数据映射**:
```
Strapi/JSON → WordPress
├── title → post_title
├── description → post_excerpt
├── content → post_content
├── created_at → post_date
├── tags → wp_terms (tags)
├── metadata.client → custom_field
├── metadata.industry → custom_field
└── metadata.* → custom_fields
```

**新闻数据映射**:
```
Strapi/JSON → WordPress
├── title → post_title
├── summary → post_excerpt
├── content → post_content
├── date → post_date
├── image → featured_image
├── author → post_author
└── url → custom_field (original_url)
```

### 5.5 技术难点及解决方案

#### 5.5.1 字符编码问题
**问题**: 中文和特殊字符在迁移过程中出现乱码
**解决方案**: 
- 确保数据库使用utf8mb4字符集
- API请求头设置正确的Content-Type
- 文件读取时指定UTF-8编码

#### 5.5.2 大批量数据处理
**问题**: 一次性导入大量数据可能导致超时或内存溢出
**解决方案**:
- 实现分批处理机制 (每批10条记录)
- 添加请求间隔 (500ms) 避免API限制
- 实现进度跟踪和断点续传

#### 5.5.3 图片资源迁移
**问题**: 原始图片存储在外部CDN，需要处理图片引用
**解决方案**:
- 保留原始图片URL作为自定义字段
- 在WordPress中使用代理或重定向处理图片请求
- 后续可实现图片本地化存储

### 5.6 数据验证报告

#### 5.6.1 迁移统计 (预期)
- **项目数据**: 7个项目
- **新闻数据**: 67条新闻 (英文) + 47条新闻 (西班牙语)
- **预计迁移时间**: 2-3分钟
- **预期成功率**: >95%

#### 5.6.2 验证检查项
- [ ] 数据完整性: 所有记录成功迁移
- [ ] 字段映射: 所有字段正确对应
- [ ] 格式保持: 富文本格式保持完整
- [ ] 关联关系: 分类、标签关联正确
- [ ] 多语言支持: 多语言内容正确分离

### 5.7 系统变更记录

#### 5.7.1 新增文件
- `scripts/validate-json-data.ts` - 数据完整性检查工具
- `scripts/wordpress-setup.sh` - WordPress自动安装脚本
- `scripts/wordpress-data-migration.ts` - 数据迁移工具
- `.env.wordpress` - WordPress配置模板
- `data-validation-report.md` - 数据验证报告

#### 5.7.2 依赖更新
- 新增: `axios` - HTTP客户端库
- 新增: `@types/node` - Node.js类型定义

#### 5.7.3 配置变更
- 更新 `package.json` 依赖列表
- 创建WordPress专用环境配置

### 5.8 后续计划

#### 5.8.1 Strapi系统清理
- [ ] 备份Strapi数据库
- [ ] 卸载Strapi相关组件
- [ ] 清理配置文件和依赖
- [ ] 更新部署脚本

#### 5.8.2 WordPress优化
- [ ] 安装必要插件 (SEO、缓存等)
- [ ] 配置主题和样式
- [ ] 设置用户权限和角色
- [ ] 配置备份和监控

#### 5.8.3 前端集成
- [ ] 更新API调用地址
- [ ] 适配WordPress REST API
- [ ] 测试前端功能完整性
- [ ] 性能优化和缓存配置

---

**文档结束**

*本文档将根据项目进展持续更新，请关注版本变更记录。*
