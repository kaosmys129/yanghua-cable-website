# GEO 页面蓝图 1："What is Flexible Busbar" 科普页面

**页面类型**：科普页（Knowledge Page）  
**目标问题**：What is a flexible busbar?  
**数据模式**：synthetic-planning（方案假设，需品牌方提供真实数据）  
**设计日期**：2026-07-04  
**URL 建议**：/en/knowledge/what-is-flexible-busbar

---

## 一、输入、假设与边界

| 维度 | 内容 |
|------|------|
| 目标用户 | 电气工程师、配电系统设计师、采购经理、数据中心运维 |
| 用户路径 | 搜索 "what is flexible busbar" -> 到达科普页 -> 了解原理 -> 浏览产品/案例 -> 询价 |
| 转化目标 | 产品选型请求（CTA：Download Technical Datasheet / Get Quote） |
| 品牌事实 | Yanghua Cable 是柔性铜母线制造商，产品范围 200-6300A，<=3kV，IP68 |
| 合规边界 | 不编造未核验的认证、客户案例、价格 |
| 设计假设 | 页面基于公开可观察的 yhflexiblebusbar.com 内容和行业通用知识 |
| 待确认项 | 品牌创始年份、具体专利号、检测报告 URL、当前 CMS 字段结构 |

## 二、Query Fan-out 子问题覆盖

| 子问题类别 | 子问题 | 用户阶段 | 页面模块 | 答案形态 |
|-----------|--------|----------|----------|----------|
| 定义 | What is a flexible busbar? | Awareness | 首屏直接答案 | 2-3 句定义 |
| 原理 | How does a flexible busbar work? | Awareness | 核心事实卡 | 键值对 + 简易图示说明 |
| 对比 | Flexible busbar vs traditional cable | Consideration | 对比表 | `<table>` |
| 对比 | Flexible busbar vs compact busbar | Consideration | 对比表（续表） | `<table>` |
| 规格 | What is the current range of flexible busbar? | Evaluation | 规格参数卡 | `<dl>` |
| 选型 | How to choose flexible busbar? | Evaluation | 判断框架 | 步骤列表 + 判断表 |
| 应用 | Where is flexible busbar used? | Evaluation | 应用场景模块 | 列表 + 图标链接 |
| 安装 | How is flexible busbar installed? | Decision | 安装步骤 | `<ol>` |
| 成本 | How much does flexible busbar cost? | Decision | 成本因素 | 段落说明 + CTA |
| FAQ | 10+ related FAQs | All | FAQ 区 | FAQPage Schema |
| 案例 | Who uses flexible busbar? | Decision | 案例区 | 项目卡片 + 链接 |

## 三、信息架构

```
1. 首屏直接答案（H1 + 2-3句定义段落）
2. 结构化摘要（What you'll learn on this page）
3. 核心事实卡（<dl>: 电流范围、电压、防护、材质、认证）
4. "How it Works" 原理区（步骤 + 简易图示）
5. 判断框架：How to Choose Flexible Busbar（步骤 1-4）
6. 对比表：Flexible Busbar vs Traditional Cable vs Compact Busbar（<table>）
7. 应用场景区（Energy Storage / Data Center / Solar PV / EV Charging / Industrial）
8. 实体关系：Yanghua Cable 与产品/场景/认证的关系图
9. 证据区与来源台账（专利、认证、检测报告）
10. FAQ（10+ 问题，分散在中段和后段）
11. 案例区（3 个精选项目，含量化数据）
12. CTA 区（Datasheet Download / Get Quote / Contact）
13. 来源区（引用格式）
14. 结尾摘要（回收关键判断）
```

## 四、AI 可抽取模块设计

### 4.1 键值对事实卡

```html
<dl class="fact-card">
  <dt>Current Range</dt><dd>200 - 6300 A (single unit)</dd>
  <dt>Rated Voltage</dt><dd>Up to 3 kV (low voltage)</dd>
  <dt>Protection Grade</dt><dd>IP68 (dust-tight, waterproof)</dd>
  <dt>Conductor Material</dt><dd>Annealed copper (T2 grade)</dd>
  <dt>Insulation</dt><dd>XLPE / LSZH / Fire-resistant options</dd>
  <dt>Operating Temperature</dt><dd>-40 deg-C to +90 deg-C</dd>
  <dt>Certifications</dt><dd>IEC, UL, CE, CCC (source needed)</dd>
</dl>
```

### 4.2 对比表

```html
<table>
  <caption>Flexible Busbar vs Traditional Cable vs Compact Busbar -- Comparison</caption>
  <thead>
    <tr><th>Feature</th><th>Flexible Busbar</th><th>Traditional Cable</th><th>Compact Busbar</th></tr>
  </thead>
  <tbody>
    <tr><td>Current Capacity</td><td>200-6300A single unit</td><td>Multiple parallel runs needed</td><td>Limited by rigid design</td></tr>
    <tr><td>Heat Dissipation</td><td>Uniform, low hot-spot risk</td><td>Uneven, hot-spot prone</td><td>Moderate</td></tr>
    <tr><td>Installation Complexity</td><td>Low (T-connector, pre-bent)</td><td>High (multi-splicing)</td><td>Medium (rigid segments)</td></tr>
    <tr><td>Space Requirement</td><td>Compact, flexible routing</td><td>Bulky, large bend radius</td><td>Fixed layout only</td></tr>
    <tr><td>Material Usage</td><td>Optimized copper density</td><td>Higher copper consumption</td><td>Moderate</td></tr>
    <tr><td>Maintenance</td><td>Low, joint-free runs</td><td>High, multiple joints</td><td>Medium</td></tr>
    <tr><td>Typical Applications</td><td>Data center, ESS, solar, industrial</td><td>General power distribution</td><td>Building risers</td></tr>
  </tbody>
</table>
```

### 4.3 步骤列表（选型判断框架）

```html
<ol>
  <li><strong>Determine current requirement</strong>: Calculate total load (A) and derating factors (temperature, altitude, grouping).</li>
  <li><strong>Select protection level</strong>: Indoor (IP40+) vs outdoor (IP68).</li>
  <li><strong>Choose insulation type</strong>: General, fire-resistant (Z(A,B,C)N), or LSZH (WDZ).</li>
  <li><strong>Define physical constraints</strong>: Routing path, bend radius, connection points.</li>
  <li><strong>Request datasheet</strong>: Contact Yanghua for a custom busbar design tailored to your project.</li>
</ol>
```

### 4.4 FAQ（带区块分布）

**中段 FAQ（紧邻对比表之后）**：
1. What is the difference between flexible busbar and cable?
2. Can flexible busbar replace traditional cable in existing installations?
3. What is the maximum length of a single flexible busbar run?

**后段 FAQ（案例区之后）**：
4. What certifications does Yanghua flexible busbar have?
5. How long does installation take compared to cable?
6. Is flexible busbar suitable for outdoor use?
7. What is the lead time for custom flexible busbar orders?
8. How does flexible busbar handle short-circuit conditions?
9. Can flexible busbar be used in seismic zones?
10. What maintenance does flexible busbar require?

## 五、实体关系与知识图谱字段

| 实体 | 类型 | 关系 | 来源字段 | 页面锚点 | Schema @id |
|------|------|------|----------|----------|------------|
| Yanghua Cable | Organization | manufacturerOf | 品牌信息 | #manufacturer | #org |
| Flexible Busbar | Product | manufacturedBy Yanghua | 产品描述 | #product-overview | #product |
| IP68 | Certification/Standard | certifies Flexible Busbar | 规格卡 | #specifications | - |
| Data Center | ApplicationScenario | uses Flexible Busbar | 应用区 | #applications | - |
| Energy Storage | ApplicationScenario | uses Flexible Busbar | 应用区 | #applications | - |
| Huawei Data Center | UseCase/Project | deployed Flexible Busbar | 案例区 | #cases | #case-1 |
| Traditional Cable | CompetitorProduct | comparedWith Flexible Busbar | 对比表 | #comparison | - |

## 六、Schema 建议

### 页面级 Schema（JSON-LD）

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "#article",
  "headline": "What is Flexible Busbar? Complete Guide to High-Current Copper Busbar Systems",
  "description": "A comprehensive guide explaining what flexible busbar is, how it works, comparison with traditional cable, selection framework, applications in data centers, energy storage, and solar PV, and FAQ.",
  "author": { "@type": "Organization", "name": "Yanghua Cable" },
  "datePublished": "2026-07-04",
  "dateModified": "2026-07-04",
  "publisher": { "@id": "#org" },
  "about": { "@id": "#product" }
}
```

### FAQPage Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What is the difference between flexible busbar and cable?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
    { "@type": "Question", "name": "Can flexible busbar replace traditional cable in existing installations?", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
  ]
}
```

### Organization Schema (linked)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "#org",
  "name": "Yanghua Cable",
  "url": "https://www.yhflexiblebusbar.com",
  "logo": "https://www.yhflexiblebusbar.com/logo.png",
  "description": "Manufacturer of high-current flexible copper busbar systems (200-6300A)",
  "address": { "@type": "PostalAddress", "addressLocality": "Dongguan", "addressRegion": "Guangdong", "addressCountry": "CN" },
  "email": "info@yhflexiblebusbar.com",
  "telephone": "+86-769-3893-9888",
  "sameAs": ["https://www.linkedin.com/company/yanghua-cable"]
}
```

### BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.yhflexiblebusbar.com/en" },
    { "@type": "ListItem", "position": 2, "name": "Knowledge", "item": "https://www.yhflexiblebusbar.com/en/knowledge" },
    { "@type": "ListItem", "position": 3, "name": "What is Flexible Busbar" }
  ]
}
```

## 七、CMS 字段清单

| 字段 Key | 中文名 | 类型 | 必填 | 来源 | 前端位置 | 进入 Schema |
|----------|--------|------|------|------|----------|-------------|
| title | 页面标题 | text | 是 | CMS 编辑器 | H1 | Article.headline |
| direct_answer | 直接答案 | textarea | 是 | 技术专家撰写 | 首屏 | Article.description |
| current_range_min | 电流下限(A) | number | 是 | 产品数据 | 事实卡 | Product 属性 |
| current_range_max | 电流上限(A) | number | 是 | 产品数据 | 事实卡 | Product 属性 |
| rated_voltage | 额定电压 | text | 是 | 产品数据 | 事实卡 | Product 属性 |
| protection_grade | 防护等级 | text | 是 | 产品数据 | 事实卡 | Product 属性 |
| insulation_types | 绝缘类型 | multi-select | 是 | 产品目录 | 事实卡 | Product 属性 |
| comparison_rows | 对比表行 | repeatable | 是 | 技术专家撰写 | 对比表 | -（HTML table） |
| selection_steps | 选型步骤 | repeatable+order | 是 | 技术专家撰写 | 判断框架 | HowTo schema |
| application_scenarios | 应用场景 | repeatable | 是 | 行业方案 | 场景区 | - |
| faq_items | FAQ 问答 | repeatable | 是 | 客户问题库 | 中段+后段 | FAQPage |
| case_studies | 案例 | reference | 否 | 项目页面 | 案例区 | - |
| evidence_items | 证据台账 | repeatable | 是 | 官方文档 | 来源区 | - |
| query_fanout_items | Query扩展 | repeatable | 是 | SEO 规划 | 元数据 | - |
| last_reviewed_date | 最后审校日期 | date | 是 | CMS 自动 | 页脚 | Article.dateModified |
| author_name | 作者 | text | 是 | 编辑分配 | 作者行 | Article.author |
| breadcrumb_path | 面包屑路径 | text | 否 | CMS 自动 | 导航 | BreadcrumbList |

## 八、证据区与来源台账

| 来源名称 | URL/文档名 | 核验日期 | 可信度 | 对应结论 | 页面位置 |
|----------|-----------|----------|--------|----------|----------|
| Yanghua 产品页 | /en/products | 2026-07-04 | 高 | 电流范围 200-6300A | 事实卡 |
| Yanghua 产品页 | /en/products | 2026-07-04 | 高 | IP68 防护 | 事实卡 |
| 首页项目案例 | /en/projects | 2026-07-04 | 高 | Huawei/CATL/BYD 案例 | 案例区 |
| IEC 标准 | 待补充检测报告 | 待确认 | 待定 | IEC 认证声明 | 规格卡 |
| ISO 9001/14001 | FAQ 提及 | 2026-07-04 | 中 | 质量管理认证 | 证据区 |

## 九、平台适配

| 平台 | 适配要点 |
|------|----------|
| DeepSeek | 保留完整逻辑链（原理 -> 对比 -> 选型），不截断推理路径 |
| 千问 | 强化来源标注和引用格式，段落保持独立性 |
| Kimi | 保留长文层级结构，使用稳定 `id` 锚点 |
| 豆包 | 首屏放轻量直接答案 + 键值对，避免复杂表格 |
| 元宝 | 公众号版保留 H2 定义、3 条对比、5 条 FAQ、CTA 弱提示 |
| Google AI | 增强 Schema 标记，确保正文覆盖 query fan-out |

## 十、移动端与公众号版建议

### 移动端
- 对比表改为 2 列表格（Feature | Flexible Busbar），Traditional Cable 和 Compact Busbar 用文字段落描述
- FAQ 保持折叠，但折叠内容对爬虫可见
- 事实卡改为纵向堆叠

### 公众号版
- 保留：H1 定义、事实卡、3 条 FAQ、案例摘要
- 删除：复杂对比表、Schema JSON、证据台账表格
- CTA：弱提示文字 "了解更多请访问官网"，不放大按钮

## 十一、实施验收与监测计划

| 验收项 | 检查方法 | 验收标准 |
|--------|----------|----------|
| Schema 完整性 | Google Rich Results Test / Schema Markup Validator | Article + FAQPage + BreadcrumbList 无错误 |
| 首屏直接答案 | 页面检查 | H1 下 2-3 句定义位于 viewport 首屏 |
| 对比表语义 | HTML 源码检查 | 使用 `<table>` + `<caption>` + `<thead>` |
| 事实卡结构 | HTML 源码检查 | 使用 `<dl>` 包裹键值对 |
| FAQ 可见性 | 禁用 JS 后检查 | 所有 FAQ 问题+答案可见（不依赖 JS 交互） |
| 内链完整 | 页面链接检查 | 含指向 Products / Projects / Contact 的链接 |
| 数据一致性 | 与产品页对比 | 电流范围、认证等数据一致 |

---

**设计假设声明**：本蓝图基于 yhflexiblebusbar.com 现有公开内容构建。具体数值（电流、电压、防护等级）来自现有产品页观察。客户案例名称来自首页公开信息。所有未核验数据（认证年份、专利号、检测报告）标记为方案假设，需品牌方确认后填入。
