# 多语言网站国际化实施框架PRD文档

## 文档信息
- **项目名称**: Yanghua B2B Website 多语言国际化框架
- **文档版本**: v1.0
- **创建日期**: 2024年12月
- **最后更新**: 2024年12月
- **文档类型**: 产品需求文档 (PRD)

## 目录
1. [项目概述](#1-项目概述)
2. [现有技术实现分析](#2-现有技术实现分析)
3. [多语言实施标准与规范](#3-多语言实施标准与规范)
4. [新增语种配置流程](#4-新增语种配置流程)
5. [SEO与元数据处理规范](#5-seo与元数据处理规范)
6. [质量保证与测试规范](#6-质量保证与测试规范)
7. [维护与更新流程](#7-维护与更新流程)
8. [实施时间表](#8-实施时间表)
9. [风险评估与应对策略](#9-风险评估与应对策略)
10. [附录](#10-附录)
11. [法语与葡萄牙语快速实施清单](#11-法语与葡萄牙语快速实施清单)
12. [开发ToDo清单（可执行）](#12-开发todo清单可执行)
13. [国际化框架优化与SEO最佳实践](#13-国际化框架优化与seo最佳实践)
14. [URL路由策略优化与冲突避免](#14-url路由策略优化与冲突避免)
15. [多语言内容管理系统配置指南](#15-多语言内容管理系统配置指南)
16. [多语言SEO元数据管理方案](#16-多语言seo元数据管理方案)
17. [质量保证与测试方案（多语言版本）](#17-质量保证与测试方案多语言版本)

---

## 1. 项目概述

### 1.1 项目背景
Yanghua B2B Website 是一个面向全球市场的电缆产品B2B网站，目前已实现英语和西班牙语双语版本。为了进一步拓展国际市场，需要建立标准化的多语言国际化实施框架，支持快速添加新的语言版本。

### 1.2 项目目标
- **主要目标**: 建立标准化的多语言实施框架，支持快速添加新语言版本
- **技术目标**: 基于现有Next.js + next-intl架构，优化多语言实现流程
- **业务目标**: 提升国际市场覆盖率，增强用户体验
- **维护目标**: 降低多语言版本维护成本，提高内容更新效率

### 1.3 适用范围
本框架适用于：
- 新增语言版本的实施
- 现有语言版本的优化
- 多语言内容的维护与更新
- 国际化SEO优化

---

## 2. 现有技术实现分析

### 2.1 核心技术栈

#### 2.1.1 主要技术组件
```typescript
// 核心依赖
- Next.js 14+ (App Router)
- next-intl (国际化框架)
- TypeScript
- Tailwind CSS
- Strapi CMS (内容管理)
```

#### 2.1.2 国际化配置
```typescript
// next-intl.config.js
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en'
});
```

### 2.2 路由架构分析

#### 2.2.1 动态路由结构
```
src/app/[locale]/
├── page.tsx                    # 首页
├── layout.tsx                  # 全局布局
├── about/
│   └── page.tsx               # 关于我们
├── products/
│   ├── page.tsx               # 产品列表
│   └── category/[name]/
│       └── page.tsx           # 产品分类
├── solutions/
│   ├── page.tsx               # 解决方案列表
│   └── [id]/
│       └── page.tsx           # 解决方案详情
├── projects/
│   ├── page.tsx               # 项目列表
│   └── [id]/
│       └── page.tsx           # 项目详情
├── services/
│   └── page.tsx               # 服务页面
└── contact/
    └── page.tsx               # 联系我们
```

#### 2.2.2 路由生成机制
```typescript
// 静态参数生成
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 元数据生成
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description')
  };
}
```

### 2.3 组件级多语言实现

#### 2.3.1 客户端组件实现
```typescript
// 示例：Hero组件
'use client';
import { useTranslations, useLocale } from 'next-intl';

export default function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  
  return (
    <section>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <Link href={`/${locale}/products`}>
        {t('cta')}
      </Link>
    </section>
  );
}
```

#### 2.3.2 服务端组件实现
```typescript
// 示例：产品页面
import { getTranslations } from 'next-intl/server';

export default async function ProductsPage({ params: { locale } }) {
  const t = await getTranslations('products');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

#### 2.3.3 语言切换组件
```typescript
// LanguageSwitcher组件
export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const switchLanguage = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };
  
  return (
    <select onChange={(e) => switchLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
    </select>
  );
}
```

### 2.4 语言包管理

#### 2.4.1 语言包结构
```
src/messages/
├── en.json                     # 英语语言包
└── es.json                     # 西班牙语语言包
```

#### 2.4.2 语言包组织方式
```json
{
  "navigation": {
    "home": "Home",
    "products": "Products",
    "solutions": "Solutions",
    "services": "Services",
    "about": "About",
    "contact": "Contact"
  },
  "hero": {
    "title": "Leading Cable Solutions",
    "subtitle": "Professional electrical cables for industrial applications",
    "cta": "Explore Products"
  },
  "products": {
    "title": "Our Products",
    "categories": {
      "flexible_busbar": "Flexible Busbar",
      "specifications": "Specifications",
      "comparison": "Product Comparison",
      "accessories": "Accessories"
    }
  }
}
```

---

## 3. 多语言实施标准与规范

### 3.1 文本内容抽取与替换规范

#### 3.1.1 硬编码文本识别标准
- **识别范围**: 所有用户可见的文本内容
- **排除内容**: 
  - 开发调试信息
  - 错误日志
  - 代码注释
  - API端点名称

#### 3.1.2 翻译键命名规范
```typescript
// 命名规则：模块.子模块.具体内容
"navigation.products.title"           // 导航-产品-标题
"hero.cta.primary"                   // 首页横幅-行动按钮-主要
"products.categories.flexible_busbar" // 产品-分类-柔性母线
"forms.contact.validation.required"   // 表单-联系-验证-必填
```

#### 3.1.3 文本替换实施步骤
1. **文本审计**: 使用工具扫描所有硬编码文本
2. **分类整理**: 按功能模块分类文本内容
3. **键值设计**: 设计层次化的翻译键结构
4. **逐步替换**: 按模块逐步替换硬编码文本
5. **功能验证**: 确保替换后功能正常

### 3.2 动态内容本地化处理

#### 3.2.1 CMS内容多语言化
```typescript
// Strapi内容结构示例
interface LocalizedContent {
  id: number;
  locale: string;
  title: string;
  description: string;
  content: string;
  slug: string;
  localizations: LocalizedContent[];
}
```

#### 3.2.2 动态数据处理规范
- **数据获取**: 根据当前语言环境获取对应内容
- **回退机制**: 当目标语言内容不存在时，回退到默认语言
- **缓存策略**: 实施适当的缓存机制提升性能

### 3.3 静态资源本地化

#### 3.3.1 图片资源处理
```typescript
// 本地化图片路径结构
public/
├── images/
│   ├── en/
│   │   ├── hero-banner.jpg
│   │   └── product-catalog.pdf
│   ├── es/
│   │   ├── hero-banner.jpg
│   │   └── product-catalog.pdf
│   └── common/
│       └── logo.svg
```

#### 3.3.2 文档资源管理
- **技术文档**: 按语言版本组织PDF、Word等文档
- **产品手册**: 提供多语言版本的产品说明书
- **证书文件**: 本地化相关认证证书

---

## 4. 新增语种配置流程

### 4.1 技术配置步骤

#### 4.1.1 路由配置更新
```typescript
// 1. 更新 next-intl.config.js
export const routing = defineRouting({
  locales: ['en', 'es', 'fr'], // 添加新语言
  defaultLocale: 'en'
});

// 2. 更新 middleware.ts
import { routing } from './next-intl.config';
export default createMiddleware(routing);
```

#### 4.1.2 语言包创建
```bash
# 创建新语言包文件
touch src/messages/fr.json

# 复制基础结构
cp src/messages/en.json src/messages/fr.json
```

#### 4.1.3 语言切换器更新
```typescript
// 更新 LanguageSwitcher 组件
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' } // 新增
];
```

### 4.2 内容翻译流程

#### 4.2.1 翻译准备阶段
1. **内容审计**: 统计需要翻译的文本量
2. **优先级排序**: 确定翻译内容的优先级
3. **术语表建立**: 创建专业术语对照表
4. **风格指南**: 制定翻译风格和语调指南

#### 4.2.2 翻译执行阶段
1. **专业翻译**: 委托专业翻译团队
2. **技术审核**: 技术团队审核翻译准确性
3. **本地化测试**: 在目标市场进行用户测试
4. **迭代优化**: 根据反馈优化翻译质量

### 4.3 部署与发布

#### 4.3.1 预发布检查清单
- [ ] 所有页面翻译完成
- [ ] 语言切换功能正常
- [ ] URL路由正确生成
- [ ] SEO元数据已本地化
- [ ] 静态资源已本地化
- [ ] 表单验证消息已翻译
- [ ] 错误页面已本地化

#### 4.3.2 发布流程
1. **测试环境部署**: 在测试环境验证新语言版本
2. **性能测试**: 确保新语言不影响网站性能
3. **SEO检查**: 验证搜索引擎优化设置
4. **生产环境部署**: 发布到生产环境
5. **监控观察**: 监控新语言版本的访问情况

---

## 5. SEO与元数据处理规范

### 5.1 多语言SEO架构

#### 5.1.1 URL结构规范
```
https://yanghua.com/en/products/flexible-busbar
https://yanghua.com/es/productos/barra-flexible
https://yanghua.com/fr/produits/barre-flexible
```

#### 5.1.2 hreflang标签实现
```typescript
// 在layout.tsx中实现
export async function generateMetadata({ params: { locale } }) {
  const alternates = {
    canonical: `https://yanghua.com/${locale}`,
    languages: {
      'en': 'https://yanghua.com/en',
      'es': 'https://yanghua.com/es',
      'fr': 'https://yanghua.com/fr',
      'x-default': 'https://yanghua.com/en'
    }
  };
  
  return { alternates };
}
```

### 5.2 元数据本地化

#### 5.2.1 页面元数据结构
```json
{
  "metadata": {
    "home": {
      "title": "Leading Cable Solutions | Yanghua",
      "description": "Professional electrical cables and flexible busbar solutions for industrial applications worldwide.",
      "keywords": "electrical cables, flexible busbar, industrial cables, power systems"
    },
    "products": {
      "title": "Products | Yanghua Cable Solutions",
      "description": "Explore our comprehensive range of electrical cables and accessories for various industrial applications."
    }
  }
}
```

#### 5.2.2 结构化数据实现
```typescript
// 产品页面结构化数据
const productSchema = {
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": t('products.flexible_busbar.title'),
  "description": t('products.flexible_busbar.description'),
  "manufacturer": {
    "@type": "Organization",
    "name": "Yanghua"
  }
};
```

### 5.3 站点地图生成

#### 5.3.1 多语言站点地图结构
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://yanghua.com/en/products</loc>
    <xhtml:link rel="alternate" hreflang="es" href="https://yanghua.com/es/productos"/>
    <xhtml:link rel="alternate" hreflang="fr" href="https://yanghua.com/fr/produits"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://yanghua.com/en/products"/>
  </url>
</urlset>
```

---

## 6. 质量保证与测试规范

### 6.1 功能测试规范

#### 6.1.1 语言切换测试
- **测试范围**: 所有页面的语言切换功能
- **测试要点**:
  - 语言切换按钮正常显示
  - 切换后URL正确更新
  - 页面内容完全切换
  - 用户状态保持一致

#### 6.1.2 内容显示测试
- **文本完整性**: 确保所有文本都已翻译
- **布局适配**: 验证不同语言文本长度对布局的影响
- **字符编码**: 确保特殊字符正确显示
- **RTL支持**: 如需要，测试从右到左语言的支持

### 6.2 性能测试规范

#### 6.2.1 加载性能测试
- **首屏加载时间**: 各语言版本首屏加载时间对比
- **资源加载优化**: 确保只加载当前语言所需资源
- **缓存策略验证**: 验证多语言内容的缓存效果

#### 6.2.2 SEO测试规范
- **搜索引擎收录**: 验证各语言版本被正确收录
- **元数据检查**: 确保title、description等元数据正确
- **结构化数据验证**: 使用Google结构化数据测试工具验证

### 6.3 用户体验测试

#### 6.3.1 可用性测试
- **导航一致性**: 确保各语言版本导航结构一致
- **交互反馈**: 验证表单、按钮等交互元素的反馈
- **错误处理**: 测试错误页面和提示信息的本地化

#### 6.3.2 跨浏览器测试
- **浏览器兼容性**: 在主流浏览器中测试多语言功能
- **移动端适配**: 确保移动设备上的多语言体验
- **字体渲染**: 验证不同语言字体的渲染效果

---

## 7. 维护与更新流程

### 7.1 内容更新流程

#### 7.1.1 单语言内容更新
1. **内容修改**: 在对应语言包中修改内容
2. **本地测试**: 在开发环境验证修改效果
3. **代码审核**: 通过代码审核流程
4. **部署发布**: 部署到生产环境

#### 7.1.2 多语言同步更新
1. **基准语言更新**: 先更新基准语言（通常是英语）
2. **翻译任务创建**: 为其他语言创建翻译任务
3. **翻译执行**: 专业翻译团队执行翻译
4. **质量审核**: 技术和语言质量双重审核
5. **批量部署**: 所有语言版本同步部署

### 7.2 技术维护规范

#### 7.2.1 依赖更新管理
- **next-intl更新**: 定期更新国际化框架版本
- **兼容性测试**: 确保更新不影响现有功能
- **性能监控**: 监控更新对性能的影响

#### 7.2.2 代码质量维护
- **代码审核**: 所有多语言相关代码必须经过审核
- **测试覆盖**: 维持多语言功能的测试覆盖率
- **文档更新**: 及时更新技术文档

### 7.3 监控与分析

#### 7.3.1 访问数据分析
- **语言版本使用率**: 分析各语言版本的访问量
- **用户行为分析**: 了解不同语言用户的行为模式
- **转化率对比**: 比较各语言版本的业务转化率

#### 7.3.2 技术监控指标
- **页面加载时间**: 监控各语言版本的性能表现
- **错误率统计**: 跟踪多语言功能的错误发生率
- **SEO表现**: 监控各语言版本的搜索引擎表现

---

## 8. 实施时间表

### 8.1 项目里程碑

#### 第一阶段：框架完善（1-2周）
- **Week 1**: 
  - 完成现有代码审计
  - 优化语言包结构
  - 完善组件多语言实现
- **Week 2**:
  - 实施SEO优化
  - 完善测试用例
  - 文档编写

#### 第二阶段：新语言添加（2-4周）
- **Week 3-4**: 
  - 技术配置实施
  - 内容翻译执行
  - 功能测试验证
- **Week 5-6**:
  - 用户体验测试
  - 性能优化
  - 部署发布

#### 第三阶段：监控优化（持续）
- **持续监控**: 性能和用户体验监控
- **定期优化**: 根据数据反馈持续优化
- **内容维护**: 建立长期内容维护机制

### 8.2 资源分配

#### 8.2.1 人力资源需求
- **技术开发**: 2名前端开发工程师
- **翻译团队**: 专业翻译服务提供商
- **测试团队**: 1名QA工程师
- **项目管理**: 1名项目经理

#### 8.2.2 技术资源需求
- **开发环境**: 完整的开发测试环境
- **翻译工具**: CAT工具或翻译管理平台
- **监控工具**: 性能监控和分析工具

---

## 9. 风险评估与应对策略

### 9.1 技术风险

#### 9.1.1 性能风险
- **风险描述**: 多语言版本可能影响网站加载性能
- **影响程度**: 中等
- **应对策略**:
  - 实施代码分割和懒加载
  - 优化语言包大小
  - 使用CDN加速静态资源

#### 9.1.2 兼容性风险
- **风险描述**: 新语言可能在某些浏览器中显示异常
- **影响程度**: 低
- **应对策略**:
  - 扩大浏览器测试范围
  - 实施渐进式增强策略
  - 提供降级方案

### 9.2 业务风险

#### 9.2.1 翻译质量风险
- **风险描述**: 翻译质量不佳影响用户体验和品牌形象
- **影响程度**: 高
- **应对策略**:
  - 选择专业翻译服务商
  - 建立多轮审核机制
  - 实施本地化测试

#### 9.2.2 维护成本风险
- **风险描述**: 多语言版本维护成本过高
- **影响程度**: 中等
- **应对策略**:
  - 建立标准化流程
  - 使用自动化工具
  - 优化内容管理流程

### 9.3 市场风险

#### 9.3.1 本地化适应性风险
- **风险描述**: 内容不符合目标市场文化习惯
- **影响程度**: 中等
- **应对策略**:
  - 进行市场调研
  - 咨询本地专家
  - 实施用户测试

#### 9.3.2 竞争风险
- **风险描述**: 竞争对手抢先推出多语言版本
- **影响程度**: 低
- **应对策略**:
  - 加快实施进度
  - 突出差异化优势
  - 持续优化用户体验

---

## 10. 附录

### 10.1 技术参考文档
- [Next.js国际化官方文档](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [next-intl使用指南](https://next-intl-docs.vercel.app/)
- [Google多语言SEO指南](https://developers.google.com/search/docs/specialty/international)

### 10.2 工具推荐
- **翻译管理**: Crowdin, Lokalise, Phrase
- **性能监控**: Lighthouse, WebPageTest, GTmetrix
- **SEO分析**: Google Search Console, Screaming Frog

### 10.3 最佳实践参考
- **语言包管理**: 使用命名空间组织翻译键
- **组件设计**: 保持组件的语言无关性
- **性能优化**: 实施适当的缓存和懒加载策略

---

## 11. 法语与葡萄牙语快速实施清单

### 11.1 技术配置（Next.js + next-intl）
- 路由与语言配置
  - 更新 next-intl.config.js：
    ```typescript
    import { defineRouting } from 'next-intl/routing';
    export const routing = defineRouting({
      locales: ['en', 'es', 'fr', 'pt'],
      defaultLocale: 'en'
    });
    ```
  - 更新 middleware.ts（或沿用已有 createMiddleware），确保识别并设置 `NEXT_LOCALE` Cookie：
    ```typescript
    import { NextResponse } from 'next/server';
    import type { NextRequest } from 'next/server';
    const SUPPORTED = new Set(['en', 'es', 'fr', 'pt']);
    export function middleware(req: NextRequest) {
      const { pathname } = req.nextUrl;
      const seg = pathname.split('/')[1];
      const active = SUPPORTED.has(seg) ? seg : 'en';
      const res = NextResponse.next();
      res.cookies.set('NEXT_LOCALE', active, { path: '/' });
      return res;
    }
    export const config = { matcher: ['/((?!_next|static|assets).*)'] };
    ```
- 目录结构与页面
  - 确保 `src/app/[locale]/` 下的核心页面在 `fr` 与 `pt` 环境均可生成。
  - 使用 `generateStaticParams()` 生成静态参数：
    ```typescript
    export function generateStaticParams() {
      return ['en','es','fr','pt'].map((locale) => ({ locale }));
    }
    ```
- 语言包
  - 创建并初始化：
    ```bash
    mkdir -p src/messages
    cp src/messages/en.json src/messages/fr.json
    cp src/messages/en.json src/messages/pt.json
    ```
  - 补充 `navigation`、`metadata`、页面文案等必要命名空间键。
- 根布局与 SSR `html[lang]`
  - 在 `src/app/layout.tsx` 或 `src/app/[locale]/layout.tsx` 中，服务端稳定设置 `<html lang={locale}>`，确保从 Cookie/header/next-intl 多源读取。
- 语言切换器
  - 更新语言列表：`en / es / fr / pt`，并确保切换逻辑替换路径前缀。

### 11.2 SEO 与站点地图
- `hreflang` 实施：每个页面输出 `link[rel="alternate"]`，语言集合：`en, es, fr, pt, x-default`。
- `canonical`：以当前语言 URL 为准，避免跨语言互指造成重复收录。
- 站点地图（sitemap.xml）：为每个 URL 输出跨语言 `xhtml:link`。

### 11.3 CMS（Strapi）准备
- 启用 i18n 插件并添加 `fr` 与 `pt` locales。
- 内容类型开启 localizations；为每个条目维护各语言 slug、一致的跨语言关系。
- 建立翻译工作流：草稿 → 翻译 → 语言审核 → 技术审核 → 发布。
- Webhook/CI 集成：内容发布触发静态再生成或预热缓存。

### 11.4 测试与发布
- Playwright：将 `fr` 与 `pt` 纳入现有多语言 E2E 套件（`html[lang]`、`hreflang`、`canonical`、导航一致性）。
- 性能与可用性：Lighthouse 对比各语言指数；移动端与桌面端。
- 预发布检查清单：参照 4.3.1，扩展到 `fr/pt`。

---

## 12. 开发ToDo清单（可执行）

### 12.1 路由与中间件
- [ ] 更新 `next-intl.config.js` locales：加入 `fr`、`pt`。
- [ ] 中间件识别并设置 `NEXT_LOCALE`，与 SSR 根布局对齐。
- [ ] 完善 `matcher`，避免静态资源误匹配。

### 12.2 布局与 SSR 稳定性
- [ ] 根布局读取 locale 的多源回退（Cookie/header/next-intl）。
- [ ] 所有语言页面 SSR 输出 `<html lang>` 正确。
- [ ] 客户端语言切换器与 SSR 输出一致。

### 12.3 文案与语言包
- [ ] 初始化 `fr.json` 与 `pt.json`，覆盖 `navigation`、`metadata`、核心页面命名空间。
- [ ] 建立术语表与风格指南，确保专业一致性。

### 12.4 页面与 URL
- [ ] 为 `fr/pt` 核心页面实现路由与页面组件。
- [ ] 统一 slug 规范：小写、连字符、语言内语义一致，跨语言 1:1 对齐。
- [ ] 基于 locale 输出 `canonical` 与 `alternates`。

### 12.5 CMS 与工作流
- [ ] Strapi 启用 `fr/pt` locales；为涉及页面绑定多语言内容。
- [ ] 配置预览与发布 Webhook；内容发布驱动增量再生成。
- [ ] 建立翻译审批流程与质量基线。

### 12.6 SEO 与元数据
- [ ] 在 `generateMetadata` 中统一输出 `title/description/keywords`、`canonical`、`hreflang`。
- [ ] 输出语言化 Open Graph、Twitter Card 与结构化数据。
- [ ] 生成多语言 sitemap 与 robots 规则校验。

### 12.7 测试与CI
- [ ] 扩展 Playwright 套件纳入 `fr/pt`，加入 `lang/hreflang/canonical` 校验。
- [ ] 在 CI 中配置 `PLAYWRIGHT_BASE_URL`，生成报告归档到 `test-results/`。
- [ ] 设定失败门槛与质量门禁（PR 必须通过多语言校验）。

---

## 13. 国际化框架优化与SEO最佳实践

### 13.1 `html[lang]` SSR 稳定输出
- 根布局服务端设置 `<html lang>`，从 `NEXT_LOCALE` Cookie、`x-locale` header 与 `next-intl` 获取，保证三重回退。
- 禁止客户端二次覆盖 `lang`，避免闪烁与不一致。

### 13.2 `hreflang` 策略
- 每个页面输出全量 `alternate`：`en`、`es`、`fr`、`pt`、`x-default`。
- 链接指向对应语言的规范化 URL，确保 1:1 对齐与互指完整性。

### 13.3 `canonical` 策略
- 每个语言页面的 canonical 指向该语言自身 URL，避免互相 canonical 导致重复内容判定。
- 对无语言前缀访问（如 `/products`）统一 301 跳转到默认语言（`/en/products`）。

### 13.4 结构化数据与社交元数据
- JSON-LD：输出语言化 `name/description`，与页面文案一致。
- Open Graph/Twitter：
  - `og:locale`: `en_US/es_ES/fr_FR/pt_PT`（或按目标市场调整）。
  - `og:title/og:description`：按语言包生成。

### 13.5 抓取与索引控制
- 统一处理尾随斜杠与大小写，避免重复路径。
- 对含追踪参数的 URL 输出 `canonical` 指向干净路径；或利用 `robots` 限制不重要参数页面索引。

---

## 14. URL 路由策略优化与冲突避免

### 14.1 前缀与保留路径
- 强制语言前缀：`/en|/es|/fr|/pt`。
- 保留路径避免与语言代码冲突（如 `/api`、`/_next`、`/assets`）。

### 14.2 slug 规范
- 语言内：小写、短横线分隔、语义明确；
- 跨语言：建立 slug 映射表（CMS 管理），保持 1:1 对齐。

### 14.3 重写/重定向
- `next.config.mjs`：
  ```javascript
  export default {
    redirects: async () => ([
      { source: '/products', destination: '/en/products', permanent: true },
    ]),
    // 按需配置 rewrites 保持内部路由整洁
  };
  ```

### 14.4 生成参数与构建
- 在所有动态页面提供 `generateStaticParams()` 返回 `['en','es','fr','pt']`；
- 确保构建时生成四语版本并正确预渲染。

---

## 15. 多语言内容管理系统配置指南（Strapi）

### 15.1 启用与语言设置
- 启用 i18n 插件，新增 `fr`、`pt`（并确认默认语言为 `en`）。
- 为目标内容类型（产品、解决方案、项目、文章）开启 localizations。

### 15.2 字段与关系
- 为每种语言维护独立 `title/description/content/slug`；
- 通过 `localizations` 关联同一实体的不同语言版本；
- 统一媒体资产（如 PDF/图片）按语言目录组织。

### 15.3 工作流与权限
- 角色：作者→翻译→语言审核→技术审核→发布；
- 建立提交规范与检查清单，确保一致性与质量基线。

### 15.4 预览与发布
- 预览 URL：`/api/preview?locale=fr|pt&slug=...`；
- Webhook：内容发布触发 Next.js 再生成或缓存失效；
- 版本管理：在 CMS 保留语言版本对照与变更记录。

---

## 16. 多语言 SEO 元数据管理方案

### 16.1 元数据结构设计
- 在语言包（`src/messages/*`）或专用配置中维护：
  ```json
  {
    "metadata": {
      "home": {
        "title": "Accueil | Yanghua",
        "description": "Solutions de câbles professionnels...",
        "keywords": "câbles, barre flexible"
      }
    }
  }
  ```

### 16.2 `generateMetadata` 实现示例
```typescript
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const base = `https://yanghua.com/${locale}`;
  return {
    title: t('page.title'),
    description: t('page.description'),
    alternates: {
      canonical: base,
      languages: {
        en: `https://yanghua.com/en`,
        es: `https://yanghua.com/es`,
        fr: `https://yanghua.com/fr`,
        pt: `https://yanghua.com/pt`,
        'x-default': `https://yanghua.com/en`
      }
    },
    openGraph: {
      locale: locale === 'en' ? 'en_US' : locale === 'es' ? 'es_ES' : locale === 'fr' ? 'fr_FR' : 'pt_PT',
      title: t('page.title'),
      description: t('page.description')
    }
  };
}
```

### 16.3 站点地图与 robots
- 生成多语言 sitemap，输出 `xhtml:link` 互指；
- 在 robots 中避免索引不必要参数页；
- 持续监控 Search Console 的跨语言覆盖情况与提示。

---

## 17. 质量保证与测试方案（多语言版本）

### 17.1 测试范围
- 语言识别与切换：URL 前缀、Cookie 与 SSR 一致性；
- 页面验证：`html[lang]`、`hreflang`、`canonical`、OG 与结构化数据；
- 内容完整性：核心页面文案在 `en/es/fr/pt` 的覆盖与一致性；
- 导航一致性与路由跳转；
- 站点地图与 robots；
- 性能指标：Lighthouse（移动/桌面）。

### 17.2 自动化实现
- Playwright：扩展现有套件，加入 `fr/pt` 的 URL 集合；
- 报告：JSON/HTML 输出至 `test-results/`，在 CI 中归档与门禁；
- 阈值：关键校验项（`lang/hreflang/canonical`）全量通过方可合入。

### 17.3 测试数据与维护
- 维护页面清单（核心路径）与跨语言对照表；
- 当新增页面或语言时，更新清单并回归执行；
- 结合错误收集与分析报告（如 `ERROR_COLLECTION_README.md`）持续优化。

---

**文档结束**

*本文档将根据项目进展和实际需求持续更新和完善。*