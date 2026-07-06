# GEO 技术快赢清单 + Schema 代码模板

**用途**：立即可执行的技术修复项，供开发团队直接使用  
**日期**：2026-07-04  
**适用范围**：https://www.yhflexiblebusbar.com（Astro v5.18.2 + Vercel）

---

## 一、Robots.txt 优化建议

### 当前文件
```
User-Agent: *
Allow: /
Disallow: /api/
Sitemap: https://www.yhflexiblebusbar.com/sitemap.xml
```

### 优化后（建议）
```
User-Agent: Googlebot
Allow: /
Disallow: /api/
Crawl-delay: 1

User-Agent: *
Allow: /
Disallow: /api/

Sitemap: https://www.yhflexiblebusbar.com/sitemap.xml
Sitemap: https://www.yhflexiblebusbar.com/sitemap-en.xml
Sitemap: https://www.yhflexiblebusbar.com/sitemap-es.xml
```

**说明**：
- 为 Googlebot 单独声明，增加 crawl-delay 防止高峰期过载
- 建议拆分为独立 sitemap（按语言）
- `/api/` 继续禁止

---

## 二、Sitemap.xml 优化

### 当前问题
- 单一 sitemap.xml 包含 EN+ES 混合，无 hreflang 标记
- 无图片/视频 sitemap
- 无 lastmod 优先级区分（所有文章同一频率）

### 建议方案：Sitemap Index

**sitemap.xml**（索引文件）：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://www.yhflexiblebusbar.com/sitemap-pages-en.xml</loc></sitemap>
  <sitemap><loc>https://www.yhflexiblebusbar.com/sitemap-products-en.xml</loc></sitemap>
  <sitemap><loc>https://www.yhflexiblebusbar.com/sitemap-articles-en.xml</loc></sitemap>
  <sitemap><loc>https://www.yhflexiblebusbar.com/sitemap-projects-en.xml</loc></sitemap>
  <sitemap><loc>https://www.yhflexiblebusbar.com/sitemap-pages-es.xml</loc></sitemap>
  <sitemap><loc>https://www.yhflexiblebusbar.com/sitemap-products-es.xml</loc></sitemap>
  <sitemap><loc>https://www.yhflexiblebusbar.com/sitemap-articles-es.xml</loc></sitemap>
</sitemapindex>
```

**sitemap-articles-en.xml**（示例，含 hreflang）：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://www.yhflexiblebusbar.com/en/articles/hub/custom-busbar-systems</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://www.yhflexiblebusbar.com/en/articles/hub/custom-busbar-systems"/>
    <xhtml:link rel="alternate" hreflang="es" href="https://www.yhflexiblebusbar.com/es/articulos/hub/custom-busbar-systems"/>
    <lastmod>2026-07-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

**说明**：
- GEO 文章建议 `changefreq: weekly`，产品页和案例页 `monthly`
- 图片 sitemap 可后续补充（当产品图片成为竞争差异化因素时）

---

## 三、页面标题 H1/H2 规范

### 3.1 各页面 H1 建议值

| 页面 | 当前 H1 | 建议 H1 | 理由 |
|------|---------|---------|------|
| 首页 | Yanghua Cable - Innovator in low-voltage, high-current copper busbar distribution | High-Current Flexible Copper Busbar Manufacturer | Yanghua Cable | 实体名前置 |
| 产品列表 | Our Electrical Power Distribution Products | Flexible Copper Busbar Products | 200-6300A High-Current Range | 关键词 + 数值 |
| 文章列表 | Articles | Flexible Busbar Technical Guides, Case Studies & Industry Insights | 明确内容范围 |
| 文章详情(示例) | Custom Flexible Busbar Systems | Custom Flexible Busbar Systems: Tailored Design for High-Current Projects | 主标题 + 副标题 |

### 3.2 H2 层级规范

**产品页 H2 重构**：
```
H2: Technical Specifications       ← 移到产品分类之前
H2: Product Categories             ← 新 H2 分组
  H3: General Purpose Cables
  H3: Fire-Resistant Cables
  H3: Low Smoke & Halogen-Free Cables
  H3: Flexible Busbar Accessories
H2: Why Choose Yanghua Cable
H2: Frequently Asked Questions
```

**文章列表页 H2 分组**：
```
H2: Featured GEO Technical Articles     ← 优先展示
H2: Industry Application Insights
H2: Company News & Events
H2: Project Spotlights
```

---

## 四、Schema 代码模板

### 4.1 增强版 Organization（首页用）

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.yhflexiblebusbar.com/en#org",
  "name": "Yanghua Cable",
  "alternateName": "Yanghuasti",
  "url": "https://www.yhflexiblebusbar.com",
  "logo": "https://www.yhflexiblebusbar.com/logo.png",
  "description": "Manufacturer of high-current flexible copper busbar systems (200-6300A) for data centers, energy storage, solar PV, EV charging, and industrial power distribution.",
  "foundingDate": "[待补充]",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Dongguan",
    "addressRegion": "Guangdong",
    "addressCountry": "CN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+86-769-3893-9888",
    "email": "info@yhflexiblebusbar.com",
    "contactType": "sales"
  },
  "sameAs": [
    "[待补充 LinkedIn URL]",
    "[待补充 YouTube URL]"
  ]
}
```

### 4.2 产品页 CollectionPage + ItemList（产品列表页用）

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Flexible Copper Busbar Products",
  "description": "High-current flexible copper busbar systems from Yanghua Cable. Current range 200-6300A, rated voltage up to 3kV, IP68 protection available.",
  "url": "https://www.yhflexiblebusbar.com/en/products",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Product",
          "@id": "https://www.yhflexiblebusbar.com/en/products/flexible-busbar-2000a#product",
          "name": "Flexible Busbar 2000A",
          "description": "2000A flexible copper busbar for high-current power distribution.",
          "category": "Flexible Busbar",
          "manufacturer": { "@id": "https://www.yhflexiblebusbar.com/en#org" }
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Product",
          "@id": "https://www.yhflexiblebusbar.com/en/products/flexible-busbar-1500a#product",
          "name": "Flexible Busbar 1500A",
          "category": "Flexible Busbar",
          "manufacturer": { "@id": "https://www.yhflexiblebusbar.com/en#org" }
        }
      }
    ]
  }
}
```

### 4.3 个体产品页 Product Schema（产品详情页用）

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "#product",
  "name": "Flexible Copper Busbar 2000A",
  "description": "2000A flexible copper busbar for data center, energy storage, and industrial power distribution. IP68 protection, T2 copper conductor, customizable length and connectors.",
  "category": "Flexible Busbar",
  "manufacturer": { "@id": "https://www.yhflexiblebusbar.com/en#org" },
  "brand": { "@type": "Brand", "name": "Yanghua Cable" },
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStock",
    "businessFunction": "https://schema.org/LeaseOut"
  }
}
```

### 4.4 文章详情页 Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "#article",
  "headline": "Why Multi-Parallel Cables Overheat & How Flexible Busbar Cures Current Inequality",
  "description": "Multi-parallel cables often have one cable heating up first due to current inequality. Learn how Yanghua's high-current flexible busbar (200-6300A) solves this problem in power distribution.",
  "author": { "@type": "Organization", "name": "Yanghua Cable" },
  "publisher": { "@id": "https://www.yhflexiblebusbar.com/en#org" },
  "datePublished": "2026-07-01",
  "dateModified": "2026-07-01",
  "url": "https://www.yhflexiblebusbar.com/en/articles/yanghua-insights-multi-parallel-cables-always-have-one-heating-up-first-this-flexible-busbar-cures-current-inequality-505135",
  "mainEntityOfPage": "https://www.yhflexiblebusbar.com/en/articles/yanghua-insights-multi-parallel-cables-always-have-one-heating-up-first-this-flexible-busbar-cures-current-inequality-505135",
  "inLanguage": "en",
  "about": [
    { "@type": "Thing", "name": "Flexible Busbar" },
    { "@type": "Thing", "name": "Current Inequality" },
    { "@type": "Thing", "name": "Power Distribution" }
  ]
}
```

### 4.5 FAQPage Schema（产品页/文章页 FAQ 区用）

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the main advantages of flexible busbar systems over traditional cable systems?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Flexible busbar systems offer superior current carrying capacity, better heat dissipation, reduced installation time, and lower maintenance requirements compared to traditional cable systems. They also provide better space utilization and improved safety features."
      }
    },
    {
      "@type": "Question",
      "name": "How do I determine the right current rating for my application?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The current rating depends on your load requirements, ambient temperature, installation method, and safety factors. Our technical team can help you calculate the optimal rating based on your specific application requirements and local electrical codes."
      }
    },
    {
      "@type": "Question",
      "name": "What certifications do your products have?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our products are certified to international standards including IEC, UL, CE, and CCC. We also have ISO 9001 quality management certification and ISO 14001 environmental management certification. Specific certifications vary by product line."
      }
    },
    {
      "@type": "Question",
      "name": "Do you provide installation support and training?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we provide comprehensive installation support including detailed manuals, video tutorials, on-site training, and remote assistance. Our technical team can also supervise critical installations to ensure optimal performance."
      }
    },
    {
      "@type": "Question",
      "name": "What is the typical lead time for custom orders?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lead times vary depending on the complexity and quantity of the order. Standard products typically ship within 2-3 weeks, while custom solutions may require 4-8 weeks. We'll provide accurate delivery schedules during the quotation process."
      }
    }
  ]
}
```

### 4.6 BreadcrumbList Schema（通用模板）

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.yhflexiblebusbar.com/en" },
    { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://www.yhflexiblebusbar.com/en/products" },
    { "@type": "ListItem", "position": 3, "name": "Flexible Busbar 2000A" }
  ]
}
```

---

## 五、Astro 集成代码示例

在 Astro 布局组件中集成 Schema 的方式：

```astro
---
// src/layouts/BaseLayout.astro
const { schema } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- ... meta tags ... -->
    <script type="application/ld+json" set:html={JSON.stringify(schema)}></script>
  </head>
  <body>
    <!-- 面包屑导航 -->
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/en">Home</a></li>
        <li><a href="/en/products">Products</a></li>
        <li aria-current="page">Flexible Busbar 2000A</li>
      </ol>
    </nav>
    <main id="main">
      <slot />
    </main>
  </body>
</html>
```

---

## 六、优先级执行顺序

| 顺序 | 动作 | 预估工时 | 依赖 | 验收方式 |
|------|------|----------|------|----------|
| 1 | 补全首页 Organization Schema（logo, address, sameAs, description） | 0.5d | 品牌提供 logo/社媒链接 | Schema Markup Validator 无错误 |
| 2 | 为产品列表页添加 CollectionPage + ItemList Schema | 0.5d | 产品列表数据可用 | 同上 |
| 3 | 为产品详情页添加 Product Schema | 1d | 产品字段数据齐全 | 同上 |
| 4 | 为产品页 FAQ 添加 FAQPage Schema | 0.5d | 无 | 同上 |
| 5 | 为文章详情页添加 Article Schema | 1d（批量） | 文章模板可修改 | 同上 |
| 6 | 为有面包屑的页面添加 BreadcrumbList Schema | 0.5d | 无 | 同上 |
| 7 | 统一全站关键数据（6400A->6300A, 40+->50+ 等） | 0.5d | 确认正确数据源 | 全站数值一致 |
| 8 | 为文章列表页添加 H2 分组 | 0.5d | 无 | HTML 检查 |
| 9 | 重构首页对比组件为 `<table>` | 1d | 前端设计验收 | HTML 检查 + 视觉回归 |
| 10 | 拆分 sitemap + hreflang | 0.5d | 无 | sitemap.xml 无错误 |

---

## 七、Schema 校验命令

部署后使用以下命令校验 Schema：

```bash
# Google Rich Results Test (需在浏览器中运行)
open "https://search.google.com/test/rich-results"

# Schema Markup Validator
open "https://validator.schema.org/"

# 本地命令行快速检查（使用 curl + node）
curl -s https://www.yhflexiblebusbar.com/en | grep 'application/ld+json' | sed 's/.*<script type="application\/ld\+json">\(.*\)<\/script>.*/\1/' | python3 -m json.tool
```

---

**文档版本**: v1.0  
**下次更新**: Schema 部署完成后，更新状态为 "已部署"
