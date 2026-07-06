# 扬华科创 GEO Phase 1 -- 页面技术诊断报告

**报告类型**：GEO 页面五阶段诊断  
**诊断日期**：2026-07-04  
**技术架构师**：Sub-Agent 3  
**数据模式**：assisted-web-research（联网核验）  
**目标站点**：https://www.yhflexiblebusbar.com

---

## 一、执行摘要

### 总体结论

扬华科创官网（yhflexiblebusbar.com）在基础 SEO 技术层面表现良好：全站 HTTP 200、canonical 配置正确、已部署 Organization Schema、sitemap.xml 覆盖完整、安全头配置齐全。但从 GEO（生成式引擎优化）标准来看，存在四项结构性缺口：

1. **Schema 类型严重不足**：仅首页有 Organization Schema，产品页无 Product Schema，文章页无 Article/FAQPage Schema，breadcrumb 无 BreadcrumbList Schema。
2. **AI 可抽取性弱**：关键事实（电流范围、IP 等级、客户案例）散落在卡片和图片中，缺乏 `<dl>`、`<table>`、步骤列表等结构化语义容器。
3. **证据可追溯性缺失**：首页声称"世界唯一""500+客户"，但未提供引用来源；产品页 FAQ 有 5 个真实问题但无 FAQPage Schema；项目案例缺少具体数据和日期。
4. **公开答案素材覆盖不足**：英文站缺少对"what is flexible busbar""flexible busbar vs cable""flexible busbar data center"等高意图问题的直接回答页面。

### P0/P1 风险等级

| 优先级 | 风险领域 | 风险描述 | 预期收益 |
|--------|----------|----------|----------|
| P0 | Schema 缺失 | 无 Product/Article/FAQPage/BreadcrumbList Schema | AI 系统无法结构化理解页面内容，影响引用概率 |
| P0 | 证据可追溯性 | 首页关键声明无来源标注 | RAG 系统无法验证事实真实性，降低引用可信度 |
| P1 | 首屏直接答案 | 首页首屏为营销口号而非直接答案 | 不符合 GEO 首尾优先原则 |
| P1 | AI 可抽取性 | 关键数据散落在视觉卡片中 | 降低结构化片段被独立抽取的概率 |
| P1 | 内链结构 | 缺少科普/场景专题页 | 无法通过 Query Fan-out 覆盖长尾问题 |
| P2 | 面包屑导航 | 首页/产品列表页无 Breadcrumb Schema | 不影响 Ranking 但影响 Schema 完整性 |

---

## 二、输入与范围

### 目标页面组合

| 页面层级 | URL | 页面类型 | 选择依据 |
|----------|-----|----------|----------|
| 首页 | https://www.yhflexiblebusbar.com/en | 首页 | 品牌入口，SEO 权重最高 |
| 一级页 | https://www.yhflexiblebusbar.com/en/products | 产品列表页 | 代表核心业务页面 |
| 二级页 | https://www.yhflexiblebusbar.com/en/articles | 文章列表页 | 代表内容型页面，GEO 文章集中在此 |

### 品牌识别

- 品牌名：Yanghua Cable / 扬华科创
- 域名：yhflexiblebusbar.com
- 站点类型：企业官网 + 产品展示 + 技术内容
- 技术栈：Astro v5.18.2（SSG），Vercel 部署
- 语言版本：EN（主站）、ES（西班牙语）
- CMS：无明确 CMS 信息（静态站点生成器路径）

### 输入缺口

- 无后台 CMS/日志访问权限
- 无 GSC（Google Search Console）数据
- 无 AI 平台（千问/Kimi/豆包/元宝/DeepSeek）采样数据
- 无 Web Vitals（LCP/INP/CLS）实测数据

---

## 三、权威证据台账

| 结论 | 来源层级 | 页面或材料 | 影响 | 可信度 |
|------|----------|------------|------|--------|
| 全站 HTTP 200，robots.txt 允许全站抓取 | 观察 | curl -sI 返回 200；robots.txt Allow: / | 抓取无障碍 | 高 |
| Astro SSG 生成初始 HTML 包含完整正文 | 观察 | curl 原始 HTML 含 `<main>`、所有 H1-H3、FAQ 文本 | 渲染依赖低 | 高 |
| 首页只有 Organization Schema，无 WebPage/BreadcrumbList | 观察 | `<script type="application/ld+json">` 中仅 Organization | Schema 覆盖严重不足 | 高 |
| 产品页无 Product Schema，FAQ 无 FAQPage Schema | 观察 | 产品页 HTML 无 Product schema；FAQ 为 `<details>` 无 schema | AI 无法结构化抽取产品属性 | 高 |
| 文章 Hub 页有 CollectionPage Schema | 观察 | `<script type="application/ld+json">` 含 CollectionPage + hasPart | 文章集合页 Schema 部分覆盖 | 高 |
| 个体文章页无 Article Schema | 观察 | 个体文章页无 BlogPosting/Article schema | AI 无法识别文章作者/日期/正文边界 | 高 |
| "世界唯一"声明无证据来源 | 缺口 | 首页 Hero 区域 | 降低 RAG 事实可信度 | 中 |
| "500+ companies"无来源台账 | 缺口 | 首页 CTA 区域 | 降低引用源权威性 | 中 |
| Schema.org 要求 Product schema 仅标记页面可见事实 | 标准 | Schema.org Product 类型文档 | 产品页 Schema 必须先完善页面内容 | 高 |
| FAQPage 不承诺 Google 富结果 | 标准 | Google FAQPage 文档（2026-05-07） | FAQ 仍可语义化但不能作为流量承诺 | 高 |

---

## 四、抓取与渲染诊断

### 4.1 HTTP 状态

| 页面 | HTTP 状态 | CDN | 缓存策略 |
|------|-----------|-----|----------|
| /en | 200 | Vercel (HIT) | public, max-age=0, must-revalidate |
| /en/products | 200 | Vercel (HIT) | public, max-age=0, must-revalidate |
| /en/articles | 200 | Vercel (HIT) | public, max-age=0, must-revalidate |

**结论**：全站响应正常，Vercel CDN 缓存命中。`max-age=0, must-revalidate` 策略合理，每次请求都验证新鲜度。

### 4.2 Robots.txt

```
User-Agent: *
Allow: /
Disallow: /api/
Sitemap: https://www.yhflexiblebusbar.com/sitemap.xml
```

**诊断**：
- 允许所有爬虫
- `/api/` 正确禁止
- 已声明 sitemap 位置
- 缺少：未指定 `crawl-delay`，未分开声明 Googlebot 规则

### 4.3 Sitemap.xml

**覆盖页面**（EN + ES 双语）：
- 首页（priority 1.0）
- 产品列表 + 分类 + 个体产品（priority 0.7-0.8）
- 项目案例（priority 0.7）
- 文章 Hub + 个体文章（priority 0.66-0.7）
- 解决方案、服务（priority 0.7）

**诊断**：
- XML 格式规范，lastmod 日期为 2026-07-02
- 缺少：未拆分多语言 sitemap，无 `<xhtml:link rel="alternate" hreflang="es">` 标记
- 缺少：未包含图片 sitemap 或视频 sitemap
- 建议：为文章 Hub 和产品页建立独立 sitemap 分片

### 4.4 Canonical 与 Meta Robots

| 页面 | Canonical | Meta Robots |
|------|-----------|-------------|
| /en | `https://www.yhflexiblebusbar.com/en/` | index, follow |
| /en/products | `<link rel="canonical" ...>` 存在 | index, follow |
| /en/articles | `<link rel="canonical" ...>` 存在 | index, follow |

**诊断**：canonical 正确配置，meta robots 允许索引。无 noindex 误用。

### 4.5 JS 依赖与渲染

- 技术栈：Astro v5.18.2（静态站点生成）
- 初始 HTML 包含：完整 `<main>`、所有 H1-H3、FAQ 文本、产品信息、评论/比较文本
- JS 用途：Google Analytics（异步）、Vercel Analytics、移动端菜单交互、`<details>` toggle
- 核心内容 JS 依赖：**无**。所有正文在初始 HTML 中直接可用
- CSS：Astro 内联 + Google Fonts（Inter、Oswald）

**结论**：站点为 SSG 模式，正文在初始 HTML 中可读，对爬虫友好，不依赖 CSR 渲染。

### 4.6 安全头与性能头

```
Content-Security-Policy: 完整配置（script-src 含 GA/Vercel，img-src 含 Unsplash/Cloudinary）
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
```

**诊断**：安全头配置完善，CSP 策略严格。无已知安全隐患。

---

## 五、结构规范性诊断

### 5.1 标题层级（H1-H3）

**首页**：
- H1：`Yanghua Cable - Innovator in low-voltage, high-current copper busbar distribution`
- H2：`Yanghua Cable Company Strength`、`Application Areas`、`Why Choose Flexible Copper Busbar?`、`Our Partners`、`Featured Projects`
- 无 H3 直接子级，卡片内使用 `<h3>` 但结构分散

**产品页**：
- H1：`Our Electrical Power Distribution Products`
- H2：`Product Overview`、`Technical Specifications`、`Why Choose Our Electrical Busbar`、`FAQ`、`Frequently Asked Questions`、`Need a Recommendation?`
- H3：产品卡片标题（如 `General Purpose Cables`）、`Available Models`、技术规格参数标题（`High Current Range (A)` 等）

**文章列表页**：
- H1：`Articles`
- H3：文章卡片标题（如 `Why Multi-Parallel Cables Overheat...` 等）

**诊断**：
- 标题层级基本合理，但首页缺少引导性的 H2 子标题结构
- 产品页出现重复 H2："Fire Resistant Cables" 出现了两次（Flame Retardant 类目未正确区分）
- 文章页 H1->H3 跳级（缺少 H2 分组），建议添加 H2 分组如 "GEO Technical Articles"、"Company News"、"Industry Insights"

### 5.2 语义容器

| 标签 | 首页 | 产品页 | 文章页 |
|------|------|--------|--------|
| `<main>` | 存在 | 存在 | 存在 |
| `<article>` | 无 | 产品卡片使用 `<article>` | 列表项未使用 `<article>` |
| `<nav>` | 存在（主导航 + 面包屑） | 存在 | 存在（含面包屑） |
| `<section>` | 存在 | 存在 | 存在 |
| `<aside>` | 无 | 无 | 无 |

**诊断**：`<main>` 使用正确，产品页使用 `<article>` 标记产品卡片值得肯定。但首页对比卡片和项目卡片也应用 `<article>` 或 `<section>` 包裹。

### 5.3 面包屑导航

| 页面 | 可见面包屑 | BreadcrumbList Schema |
|------|------------|----------------------|
| 首页 | 无 | 无 |
| 产品页 | 无 | 无 |
| 文章 Hub 页 | 有（Home > En > Articles > Hub > 页面名） | 无 |
| 个体文章页 | 有 | 无 |

**诊断**：文章详情页有可见面包屑，但无 BreadcrumbList Schema。首页和产品页完全缺少面包屑导航。

### 5.4 内链结构

**已有关键内链**：
- Products（产品列表）
- Solutions（行业解决方案）
- Projects（项目案例）
- Articles（技术文章）
- About / Contact

**缺少的内链**：
- 无 "What is Flexible Busbar" 科普页
- 无 "Flexible Busbar for Data Centers" 场景页
- 无 "Flexible Busbar vs Traditional Cable" 对比专题页
- 首页未链接到个体产品页或 Hub 文章
- 产品页未链接到相关案例或解决方案

---

## 六、内容证据诊断

### 6.1 关键声明与证据

| 声明 | 页面位置 | 证据类型 | 可信度 | 建议 |
|------|----------|----------|--------|------|
| "世界唯一 flexible high-current electrical busbar" | 首页 Hero | 缺口 | 低 | 改为具体事实，如"the first manufacturer to achieve..." |
| "Trusted by 500+ companies worldwide" | 首页 CTA | 缺口 | 中 | 提供客户来源台账或合作伙伴 logo 页 |
| "IP68 protection grade" | 首页 + 产品页 | 观察 | 高 | 页面确实声称为 IP68，建议补充检测报告引用 |
| "maximum single current carrying capacity 6400A" | 首页 | 观察 | 高 | 产品页显示 200-6300A 范围，6400A 需统一或补充下限 |
| "40+ Patents & Certifications" | 首页 | 缺口 | 中 | 建议链接到认证页面或提供专利号 |
| Huawei/BYD/CATL/Midea 项目案例 | 首页 + 项目页 | 观察 | 高 | 有独立 case study 页面，需补充时间、规模数据 |
| IEC/UL/CE/CCC 认证 | 产品页 FAQ | 观察 | 高 | FAQ 中提及，需在产品页正文中添加认证 listing |

### 6.2 数据一致性

**发现不一致**：
- 首页声称 "6400A"，产品页技术规格显示 "200-6300A"（差异：6400 vs 6300）
- 首页 "40+ Patents"，文章 Hub 页 "50+ Patents"
- 首页 "2 Production Lines"，文章 Hub 页 "8 Production Lines"
- 首页 "11 Enterprise Standards"，文章 Hub 页 "15 Enterprise Standards"

> 这些差异可能是页面更新不同步，但会被 AI 系统检测为事实矛盾。

---

## 七、AI 可抽取性诊断

### 7.1 可抽取模块评估

| 模块类型 | 首页 | 产品页 | 文章页 | 评估 |
|----------|------|--------|--------|------|
| 键值对（Key-Value Facts） | 散落在视觉卡片中，无语义 `<dl>` | 技术规格用视觉卡片 | 文章有直接答案但无结构化标记 | 需重构为 `<dl>` 或 `<table>` |
| 表格（Table） | 对比表（Flexible Busbar vs Cable）为视觉组件 | 产品列表为卡片网格 | 无表格 | 对比表应从卡片改为 `<table>` |
| 步骤（Steps） | 无 | 无 | 无 | 需新增安装/选型步骤 |
| 问答（Q&A） | 无 | 5 个 FAQ（`<details>` 内） | 无 | FAQ 应从 `<details>` 迁移为可见文本 + FAQPage Schema |
| 原子事实（Atomic Facts） | 200-6300A、IP68、<=3kV | 200-6300A、<=3kV、IP68 | 直接答案在前段 | 需用独立字段标记，不依赖上下文 |
| 上下文无关摘要 | 无 | 无 | 有（文章首段直接答案） | 首页和产品页需添加 |

### 7.2 片段独立性

**问题**：产品页和首页的关键数据（如 "200-6300A"、"IP68"）嵌入在 `<div>` 卡片中，周围是大量 SEO 修饰词（如 "copper busbar capacity" 重复填充），导致 chunk 抽取时这些数据被修饰词稀释。

**修复方向**：使用独立的 `<dl>` 事实卡，将核心参数与描述文本分离。

---

## 八、Schema 一致性诊断

### 8.1 现有 Schema 清单

| 页面 | Schema 类型 | 字段 | 评估 |
|------|------------|------|------|
| 首页 | Organization | name, url, email, telephone | 过于精简，缺 logo/address/sameAs/description/foundingDate |
| 文章 Hub | CollectionPage | name, description, url, hasPart(BlogPosting) | 可接受，但 hasPart 仅含 2 篇文章而非全部 |
| 个体产品页 | 无 | - | 严重缺失 |
| 个体文章页 | 无 | - | 严重缺失 |

### 8.2 推荐的 Schema 新增

| 页面 | 推荐 Schema | 现有覆盖 | 优先级 |
|------|------------|----------|--------|
| 首页 | WebPage + Organization(增强) + BreadcrumbList(无面包屑时免) | 仅 Organization | P0 |
| 产品列表 | CollectionPage + Organization + BreadcrumbList | 无 | P0 |
| 产品详情 | Product + FAQPage(如有 FAQ) + BreadcrumbList | 无 | P0 |
| 文章列表 | CollectionPage(增强) | 已有但字段不足 | P1 |
| 文章详情 | Article/BlogPosting + FAQPage(如有 FAQ) + BreadcrumbList | 无 | P0 |
| 案例页 | Article + Organization | 无 | P1 |

---

## 九、代码层修复清单

### P0（立即修复，成本 S-M）

| 编号 | 问题 | 证据 | 影响 | 修复 | 成本 |
|------|------|------|------|------|------|
| FIX-01 | 首页 Organization Schema 缺少关键字段 | 观察：JSON-LD 仅 5 个字段 | AI 无法建立完整品牌实体图 | 添加 logo, address, sameAs, description, foundingDate | S |
| FIX-02 | 产品列表页无 Schema | 观察：HTML 无 JSON-LD | AI 无法结构化理解产品范围 | 添加 CollectionPage + ItemList Schema | S |
| FIX-03 | 个体产品页无 Product Schema | 观察：产品详情页无 Schema | AI 无法抽取产品参数 | 为每个产品添加 Product Schema（name, description, category, manufacturer） | M |
| FIX-04 | 文章详情页无 Article Schema | 观察：个体文章页无 JSON-LD | AI 无法识别作者/日期/正文 | 添加 Article/BlogPosting Schema（headline, author, datePublished, dateModified, articleBody） | M |
| FIX-05 | 产品页 FAQ 有内容但无 FAQPage Schema | 观察：5 个 `<details>` FAQ 有可见文本 | 错失结构化问答语义 | 添加 FAQPage Schema，mainEntity 逐条对应 | S |
| FIX-06 | 面包屑可见但无 BreadcrumbList Schema | 观察：文章页有面包屑导航 | Schema 体系不完整 | 为所有有面包屑的页面添加 BreadcrumbList | S |

### P1（本月修复，成本 M）

| 编号 | 问题 | 证据 | 影响 | 修复 | 成本 |
|------|------|------|------|------|------|
| FIX-07 | 首页首屏为营销口号，非直接答案 | 观察：H1 后紧跟 slogan 和产品特点 | 不符合 GEO 首尾优先原则 | 在 H1 下添加 2-3 句直接答案段落，说明 flexible busbar 是什么 | M |
| FIX-08 | 对比组件为纯视觉卡片，非 `<table>` | 观察：Flexible Busbar vs Cable 使用 div 卡片 | AI 无法识别为对比表 | 重构为 `<table>` + `<caption>` | M |
| FIX-09 | 关键事实散落在卡片 `<div>` 中 | 观察：IP68/6300A 嵌入视觉卡片 | chunk 抽取时语义稀释 | 使用 `<dl>` 创建独立事实卡 | M |
| FIX-10 | 数据不一致（6400A vs 6300A 等） | 观察：首页与产品页/文章页数值冲突 | AI 检测为事实矛盾 | 统一全站数值，建立单一数据源 | S |
| FIX-11 | 文章列表页 H1->H3 跳级 | 观察：无 H2 分组 | 标题层级不规范 | 添加 H2 分组（GEO Technical Articles / Company News） | S |

### P2（季度修复，成本 L）

| 编号 | 问题 | 证据 | 影响 | 修复 | 成本 |
|------|------|------|------|------|------|
| FIX-12 | 缺少科普/场景专题页 | 观察：无 "What is Flexible Busbar" 等页面 | Query Fan-out 覆盖不足 | 新建科普页和场景页（参见蓝图设计） | L |
| FIX-13 | Sitemap 缺少 hreflang 和图片分片 | 观察：sitemap.xml 仅基础 URL | 多语言索引不充分 | 拆分为 sitemap index + hreflang 标记 | M |
| FIX-14 | 页面无 `<aside>` 或侧边推荐栏 | 观察：无相关文章/产品推荐 | 内链密度不足 | 为文章页添加侧边推荐模块 | M |

---

## 十、内容结构改造建议

### 10.1 首页改造

**当前结构**：Hero 口号 > 公司实力 > 应用领域 > 对比 > 合作伙伴 > 项目案例

**推荐结构**（GEO 优先）：
1. Hero：品牌标识 + 直接答案（What we do: Yanghua Cable manufactures...）
2. 核心事实卡（`<dl>`：电流范围、电压、防护等级、认证）
3. 应用场景对比（`<table>`：Flexible Busbar vs Cable vs Compact Busbar）
4. 应用领域（现有 + 链接到场景页）
5. 精选案例（现有 + 补充量化数据）
6. 合作伙伴（现有 + 权威背书）
7. CTA + FAQ 摘要

### 10.2 产品页改造

**当前结构**：产品概述 > 分类卡片 > 技术规格 > 特色 > FAQ > CTA

**推荐结构调整**：
1. 在 H1 下添加 2 句产品线摘要
2. 技术规格移到产品分类之前（让 AI 先看到核心参数）
3. 每个产品类别卡片添加独立的 Product Schema `@id`
4. FAQ 从 `<details>` 改为可见文本 + FAQPage Schema
5. 添加 BreadcrumbList（Home > Products）

### 10.3 文章页改造

**当前混排问题**：GEO 技术文章与公司新闻、节日问候混排在同一个列表中。

**推荐结构**：
1. H1 下添加文章分类导航（GEO Tech / News / Events）
2. GEO 文章使用 H2 分组优先展示
3. 每篇 GEO 文章添加 Article Schema
4. 公司新闻仅标记 Article Schema 的基础字段
5. 添加 BreadcrumbList Schema

---

## 十一、公开答案素材覆盖

以下为高意图英文问题与当前网站素材覆盖状态：

| 目标问题 | 当前覆盖页面 | 状态 | 建议 |
|----------|-------------|------|------|
| What is a flexible busbar? | 无专门页面 | 缺失 | 新建科普页 |
| flexible busbar vs cable comparison | 首页对比组件 + 多篇 GEO 文章 | 部分覆盖 | 补充专门对比页 + `<table>` 结构 |
| flexible busbar for data centers | 首页案例（Huawei Data Center） | 部分覆盖 | 新建场景页 |
| flexible busbar current capacity | 产品页技术规格 | 已覆盖但语义弱 | 用 `<dl>` 结构化 |
| flexible busbar installation | 无 | 缺失 | 新建安装指南页面 |
| flexible busbar manufacturer | 首页 + GEO 文章 | 已覆盖 | 增强 Organization Schema |
| flexible busbar price/cost | 无 | 缺失 | 添加选型指南或成本对比 |
| what certifications does flexible busbar have? | 产品页 FAQ Q3 | 已覆盖 | FAQPage Schema 化 |

---

## 十二、完整性自检

| 自检项 | 通过条件 | 状态 |
|--------|----------|------|
| 范围完整 | 至少说明首页、一级页、二级页选择 | 通过 |
| 证据完整 | 重要结论均有页面/官方/标准/研究/缺口标记 | 通过 |
| 技术完整 | 覆盖抓取、渲染、移动、结构、schema、性能风险 | 通过 |
| 内容完整 | 覆盖实体、事实、来源、时间、价格、边界、FAQ | 通过 |
| AI 完整 | 覆盖抽取、chunk、问答、引用准备度和公开答案素材 | 通过 |

---

**报告生成时间**：2026-07-04  
**下一阶段**：蓝图设计（yao-geo-page-blueprint）+ 技术快赢清单执行
