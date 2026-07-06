# GEO Phase 1 -- Schema.org & Technical SEO Code Changes

**Branch:** `geo/tech-schema-optimization`
**Commit:** `feat(geo): enhance Schema.org markup for international AI discoverability`
**Build status:** 345 pages, 0 errors, 4.59s

---

## Files Changed (8 files, 1 new)

### 1. NEW: `astro-site/src/lib/schema-utils.ts`

Centralized JSON-LD Schema generation utility for Astro. Ported from the existing Next.js `yanghua-b2b-website/src/lib/structured-data.ts` and adapted for Astro's module system using `brand` and `client` config imports.

**Exported functions:**

| Function | Description |
|---|---|
| `generateFullOrganizationSchema(siteUrl?)` | Organization with @id, logo, address, contactPoint(x2), sameAs, foundingDate, makesOffer |
| `generateCollectionPageSchema(articles, siteUrl?, locale?)` | CollectionPage with TechArticle items and ItemList |
| `generateBreadcrumbSchema(items, siteUrl?)` | BreadcrumbList with ListItem entries |
| `generateArticleSchema(post, siteUrl?)` | TechArticle with publisher, author, datePublished, keywords |
| `generateWebsiteSchema(siteUrl?)` | WebSite with SearchAction for Sitelinks Searchbox |
| `validateStructuredData(schema)` | Lightweight schema validation helper |

**Exported types:** `BreadcrumbItem`, `CollectionPageArticle`, `ArticlePost`

---

### 2. MODIFIED: `astro-site/src/layouts/BaseLayout.astro`

- **Line 15:** Added import `{ generateFullOrganizationSchema } from '../lib/schema-utils'`
- **Line 45:** Added `const resolvedSchema = schema ?? generateFullOrganizationSchema(...)` fallback logic -- when no per-page schema is provided, BaseLayout auto-generates a comprehensive Organization schema with address, contactPoint, sameAs, foundingDate, logo
- **Lines 134-135:** Replaced conditional `{schema && (<script...)}` with always-present `<script type="application/ld+json" set:html={JSON.stringify(resolvedSchema)} />` -- every page now gets at minimum the full Organization JSON-LD

**Impact:** All ~345 pages now receive baseline Organization schema markup automatically, improving SEO and AI crawler discoverability.

---

### 3. MODIFIED: `astro-site/src/pages/en/index.astro`

- **Line 20:** Added import `{ generateFullOrganizationSchema } from '../../lib/schema-utils'`
- **Lines 84-85:** Replaced inline `schema={{ '@context': 'https://schema.org', '@type': 'Organization', name: client.name, url: client.domain, email: client.email, telephone: client.phoneForTel }}` (6 lines, minimal) with `schema={generateFullOrganizationSchema(brand.url)}` (full 16-field enhanced schema)

**Impact:** English homepage JSON-LD now includes postalAddress, contactPoint, sameAs social profiles, foundingDate (2010), numberOfEmployees (100-500), and makesOffer instead of just name/email/phone.

---

### 4. MODIFIED: `astro-site/src/pages/es/index.astro`

- Same changes as `en/index.astro` above (mirrored for Spanish homepage).

---

### 5. MODIFIED: `astro-site/src/pages/en/articles/index.astro`

- **Lines 10-11:** Added imports for `generateCollectionPageSchema` and `CollectionPageArticle` type
- **Lines 31-39:** Added `collectionArticles` mapping from article data to `CollectionPageArticle[]` and computed `collectionPageSchema` via `generateCollectionPageSchema(collectionArticles, undefined, 'en')`
- **Line 41:** Updated `<BaseLayout>` to pass `schema={collectionPageSchema}`

**Impact:** Article listing page now emits CollectionPage + ItemList + TechArticle JSON-LD containing all published articles' metadata, geo target queries, and cross-references to the Organization entity via @id.

---

### 6. MODIFIED: `astro-site/src/pages/robots.txt.ts`

- **Lines 19-31:** Added explicit AI crawler directives after the general `User-agent: *` block:

```
User-agent: GPTBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: PerplexityBot
Allow: /
```

**Impact:** OpenAI ChatGPT (GPTBot), Anthropic Claude (Claude-Web), Google Gemini/Vertex (Google-Extended), and Perplexity AI (PerplexityBot) are now explicitly allowed to crawl all public content. The `/api/` path remains disallowed for all crawlers.

---

### 7. MODIFIED: `astro-site/src/layouts/PostLayout.astro`

- **Line 7:** Added import `{ generateArticleSchema } from '../lib/schema-utils'`
- **Lines 14-21:** Extended `Props` interface with `schema?`, `url?`, `image?`, `category?`, `tags?`
- **Lines 30-44:** Added destructured `schema`, `url`, `image`, `category`, `tags` props and computed `resolvedSchema` fallback: when no explicit schema is passed but `url` is provided, auto-generates a TechArticle schema using `generateArticleSchema()`
- **Line 57:** Updated `<BaseLayout>` call to pass `schema={resolvedSchema}`

**Impact:** All blog article pages rendered via PostLayout automatically receive TechArticle JSON-LD with datePublished, publisher (Organization @id reference), author, and metadata. Page-level overrides still supported via optional `schema` prop.

---

## Schema Enhancement Summary

| Schema Type | Before | After |
|---|---|---|
| Organization | name, url, email, telephone (4 fields) | @id, logo, address, 2x contactPoint, sameAs, foundingDate, makesOffer, numberOfEmployees (16+ fields) |
| CollectionPage | Not present | CollectionPage + ItemList with TechArticle items including geo.about references |
| TechArticle / BlogPosting | Not present | Auto-generated for all PostLayout-rendered articles |
| BreadcrumbList | Available via utility (pre-existing) | Available via centralized `generateBreadcrumbSchema()` |
| WebSite (SearchAction) | Not present | Available via `generateWebsiteSchema()` |
| robots.txt AI directives | Generic `*` only | Explicit: GPTBot, Claude-Web, Google-Extended, PerplexityBot |

## Build Verification

```
pnpm build → 345 page(s) built in 4.59s
Exit code: 0
No errors or warnings.
```

## Rollback

To revert all changes:
```bash
git checkout main  # or the previous branch
```
