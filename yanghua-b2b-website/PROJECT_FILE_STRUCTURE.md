# 杨华B2B网站项目文件结构文档

## 项目概览
- **项目名称**: 杨华B2B网站
- **技术栈**: Next.js 15.4.4 + TypeScript + Tailwind CSS + next-intl
- **生成时间**: 2025年1月2日
- **项目路径**: `/Users/peterpc/Documents/yanghua cable web/yanghua-b2b-website`

## 完整文件结构

### 根目录
```
yanghua-b2b-website/
├── [DIR] cable/                           # 电缆相关资源目录
├── [DIR] messages/                        # 国际化翻译文件目录
│   ├── [DIR] en/                         # 英语翻译文件
│   │   ├── common.json                   # 通用翻译 (2025-01-02 21:40)
│   │   ├── contact.json                  # 联系页面翻译 (2025-01-02 21:04)
│   │   ├── home.json                     # 首页翻译 (2025-01-02 21:01)
│   │   └── navigation.json               # 导航翻译 (2025-01-02 20:34)
│   └── [DIR] es/                         # 西班牙语翻译文件
│       ├── common.json                   # 通用翻译 (2025-01-02 21:40)
│       ├── contact.json                  # 联系页面翻译 (2025-01-02 21:04)
│       ├── home.json                     # 首页翻译 (2025-01-02 21:01)
│       └── navigation.json               # 导航翻译 (2025-01-02 20:34)
├── [DIR] public/                          # 静态资源目录
│   ├── [DIR] certifications/             # 认证证书图片
│   ├── [DIR] enlighs/                    # 英语资源
│   ├── [DIR] news/                       # 新闻图片资源
│   ├── [DIR] partners/                   # 合作伙伴图片
│   ├── [DIR] products/                   # 产品图片资源
│   ├── [DIR] projects/                   # 项目图片资源
│   ├── [DIR] solutions/                  # 解决方案图片
│   ├── [DIR] spanish/                    # 西班牙语资源
│   ├── favicon.ico                       # 网站图标 (2024-07-29 11:38)
│   ├── file.svg                         # 文件图标 (2024-07-29 11:38)
│   ├── globe.svg                        # 地球图标 (2024-07-29 11:38)
│   ├── next.svg                         # Next.js图标 (2024-07-29 11:38)
│   ├── vercel.svg                       # Vercel图标 (2024-07-29 11:38)
│   └── window.svg                       # 窗口图标 (2024-07-29 11:38)
├── [DIR] src/                            # 源代码目录
│   ├── [DIR] app/                        # Next.js App Router目录
│   │   ├── [DIR] [locale]/               # 国际化路由目录
│   │   │   ├── [DIR] about/              # 关于我们页面
│   │   │   │   └── page.tsx              # 关于页面组件 (2024-08-11 12:11)
│   │   │   ├── [DIR] contact/            # 联系我们页面
│   │   │   │   └── page.tsx              # 联系页面组件 (2025-01-02 21:04)
│   │   │   ├── [DIR] news/               # 新闻页面
│   │   │   │   ├── [DIR] [id]/           # 新闻详情页
│   │   │   │   ├── [DIR] category/       # 新闻分类页
│   │   │   │   │   └── [DIR] [id]/       # 分类详情页
│   │   │   │   ├── [DIR] tag/            # 新闻标签页
│   │   │   │   │   └── [DIR] [id]/       # 标签详情页
│   │   │   │   ├── NewsPageClient.tsx    # 新闻客户端组件 (2025-01-02 17:47)
│   │   │   │   ├── NewsPageServer.tsx    # 新闻服务端组件 (2025-01-02 17:47)
│   │   │   │   └── page.tsx              # 新闻列表页 (2024-08-21 19:15)
│   │   │   ├── [DIR] products/           # 产品页面
│   │   │   │   ├── [DIR] [category]/     # 产品分类页
│   │   │   │   ├── [DIR] [id]/           # 产品详情页
│   │   │   │   │   └── page.tsx          # 产品详情组件 (2025-01-02 17:47)
│   │   │   │   ├── [DIR] category/       # 产品分类目录
│   │   │   │   │   └── [DIR] [name]/     # 分类名称页
│   │   │   │   │       └── page.tsx      # 分类页面组件 (2025-01-02 17:47)
│   │   │   │   ├── [DIR] list/           # 产品列表页
│   │   │   │   └── page.tsx              # 产品主页组件 (2025-01-02 19:58)
│   │   │   ├── [DIR] projects/           # 项目页面
│   │   │   │   ├── [DIR] [id]/           # 项目详情页
│   │   │   │   │   └── page.tsx          # 项目详情组件 (2025-01-02 17:47)
│   │   │   │   └── page.tsx              # 项目列表页 (2025-01-02 20:02)
│   │   │   ├── [DIR] services/           # 服务页面
│   │   │   │   └── page.tsx              # 服务页面组件 (2024-08-11 12:11)
│   │   │   ├── [DIR] solutions/          # 解决方案页面
│   │   │   │   ├── [DIR] [id]/           # 解决方案详情页
│   │   │   │   │   └── page.tsx          # 解决方案详情组件 (2024-08-14 16:10)
│   │   │   │   └── page.tsx              # 解决方案列表页 (2025-01-02 20:03)
│   │   │   └── page.tsx                  # 首页组件 (2025-01-02 20:04)
│   │   ├── favicon.ico                   # 应用图标 (2024-07-29 11:38)
│   │   ├── globals.css                   # 全局样式 (2024-08-08 22:32)
│   │   └── layout.tsx                    # 根布局组件 (2025-01-02 20:33)
│   ├── [DIR] components/                 # React组件目录
│   │   ├── [DIR] contact/                # 联系相关组件
│   │   │   └── ContactForm.tsx          # 联系表单组件 (2025-01-02 21:04)
│   │   ├── [DIR] home/                   # 首页组件
│   │   │   ├── ApplicationAreas.tsx      # 应用领域组件 (2025-01-02 20:58)
│   │   │   ├── CompanyStrength.tsx       # 公司实力组件 (2025-01-02 20:55)
│   │   │   ├── Hero.tsx                  # 英雄区域组件 (2025-01-02 20:39)
│   │   │   ├── InquiryForm.tsx           # 询价表单组件 (2025-01-02 21:01)
│   │   │   ├── Partners.tsx              # 合作伙伴组件 (2025-01-02 20:59)
│   │   │   └── ProductFeatures.tsx       # 产品特性组件 (2025-01-02 20:56)
│   │   ├── [DIR] layout/                 # 布局组件
│   │   │   ├── Footer.tsx                # 页脚组件 (2025-01-02 20:40)
│   │   │   └── Header.tsx                # 页头组件 (2025-01-02 20:34)
│   │   ├── [DIR] news/                   # 新闻组件
│   │   │   └── ImageWithFallback.tsx     # 图片回退组件 (2024-08-21 15:26)
│   │   ├── DebugPanel.tsx                # 调试面板组件 (2025-01-02 21:19)
│   │   ├── ErrorBoundary.tsx             # 错误边界组件 (2025-01-02 21:18)
│   │   └── LanguageSwitcher.tsx          # 语言切换组件 (2025-01-02 20:50)
│   ├── [DIR] i18n/                       # 国际化配置
│   │   └── request.ts                    # 请求配置 (2025-01-02 20:48)
│   ├── [DIR] types/                      # TypeScript类型定义
│   │   └── news.ts                       # 新闻类型定义 (2024-08-21 15:26)
│   ├── [DIR] utils/                      # 工具函数
│   │   └── errorLogger.ts                # 错误日志工具 (2025-01-02 21:18)
│   └── middleware.ts                     # Next.js中间件 (2025-01-02 20:49)
├── [DIR] web/                            # Web相关目录
│   └── [DIR] yanghua-b2b-website/        # 网站备份目录
│       └── [DIR] public/                 # 公共资源备份
│           └── [DIR] solutions/          # 解决方案资源备份
├── .DS_Store                             # macOS系统文件 (2025-01-02 21:51)
├── .gitignore                            # Git忽略文件 (2024-07-29 11:38)
├── eslint.config.mjs                     # ESLint配置 (2024-07-29 11:38)
├── i18n.js                               # 国际化配置 (2025-01-02 21:40)
├── next-env.d.ts                         # Next.js类型声明 (2024-07-29 11:38)
├── next.config.js                        # Next.js配置 (2025-01-02 20:32)
├── next.config.ts                        # Next.js TypeScript配置 (2025-01-02 18:36)
├── package-lock.json                     # 依赖锁定文件 (2025-01-02 20:31)
├── package.json                          # 项目依赖配置 (2025-01-02 20:31)
├── postcss.config.mjs                    # PostCSS配置 (2024-07-29 11:38)
├── README.md                             # 项目说明文档 (2024-07-29 11:38)
└── tsconfig.json                         # TypeScript配置 (2024-07-29 11:38)
```

## 文件类型统计

### 配置文件
- **Next.js配置**: `next.config.js`, `next.config.ts`
- **TypeScript配置**: `tsconfig.json`, `next-env.d.ts`
- **构建工具配置**: `eslint.config.mjs`, `postcss.config.mjs`
- **包管理**: `package.json`, `package-lock.json`
- **国际化配置**: `i18n.js`
- **版本控制**: `.gitignore`

### 源代码文件
- **React组件**: 25个 `.tsx` 文件
- **TypeScript文件**: 4个 `.ts` 文件
- **样式文件**: 1个 `.css` 文件
- **翻译文件**: 8个 `.json` 文件

### 静态资源
- **图标文件**: 多个 `.svg` 文件
- **图片文件**: 多个 `.webp`, `.jpg` 文件
- **网站图标**: `favicon.ico`

## 项目架构特点

### 1. 国际化支持
- 使用 `next-intl` 实现多语言支持
- 支持英语 (en) 和西班牙语 (es)
- 翻译文件按功能模块组织

### 2. 路由结构
- 采用 Next.js 15 App Router
- 动态路由支持多语言: `[locale]`
- 嵌套路由支持产品、项目、新闻等模块

### 3. 组件架构
- 按功能模块组织组件
- 包含错误处理和调试功能
- 响应式设计支持

### 4. 开发工具
- TypeScript 类型安全
- ESLint 代码规范
- Tailwind CSS 样式框架

## 最近更新记录

### 2025年1月2日
- **21:40**: 更新国际化配置和翻译文件
- **21:19**: 实现调试面板组件
- **21:18**: 添加错误边界和错误日志功能
- **21:04**: 完善联系表单和翻译
- **20:58**: 更新应用领域组件
- **20:49**: 配置中间件
- **20:33**: 更新根布局和页头组件

### 历史更新
- **2024年8月**: 基础页面和组件开发
- **2024年7月**: 项目初始化和配置

---

**文档生成时间**: 2025年1月2日  
**项目状态**: 开发中  
**技术负责人**: 开发团队