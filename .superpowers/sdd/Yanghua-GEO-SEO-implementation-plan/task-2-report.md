# Task 2 Report — Yanghua Cable GEO + SEO

Date: 2026-09-03
Task: Update page/article rendering and SEO helpers for Task 2 requirements only

## Scope completed

Implemented Task 2 in the current repository without rewriting article bodies in bulk and without changing the existing public URL patterns for existing pages.

Completed areas:

- Updated article/page SEO rendering helpers to enforce bounded titles/descriptions and protect approved primary keyword phrases from being cut during truncation.
- Added static pagination at 24 cards per page for article and project listing pages while preserving the existing root listing route as page one.
- Corrected canonical, hreflang, sitemap inclusion, and sitemap `lastmod` generation to use only real, indexable relationships.
- Added `llms-full.txt` generation and exposed crawlable footer links for `llms.txt`, `llms-full.txt`, and `articles-map.json`.
- Unified visible FAQ rendering and FAQ JSON-LD to use the same normalized source, with omission when normalized FAQ data is unavailable.
- Added/updated structured data coverage for `WebSite` + `SearchAction`, `Article`/`TechArticle`, `BreadcrumbList` named items, `CollectionPage`/`ItemList`, and `Person` authors only when approved person data exists.
- Preserved the rule that unapproved product offer/review/rating data is not emitted.

## Changed files

Modified:

- `astro-site/astro.config.mjs`
- `astro-site/src/components/Footer.astro`
- `astro-site/src/layouts/BaseLayout.astro`
- `astro-site/src/lib/schema-utils.ts`
- `astro-site/src/lib/yanghua/articles-core.mjs`
- `astro-site/src/lib/yanghua/articles.mjs`
- `astro-site/src/lib/yanghua/seo-meta.mjs`
- `astro-site/src/pages/en/articles/[slug].astro`
- `astro-site/src/pages/en/articles/index.astro`
- `astro-site/src/pages/en/projects/index.astro`
- `astro-site/src/pages/es/articulos/[slug].astro`
- `astro-site/src/pages/es/articulos/index.astro`
- `astro-site/src/pages/es/proyectos/index.astro`
- `astro-site/src/pages/pt/artigos/[slug].astro`
- `astro-site/src/pages/pt/artigos/index.astro`
- `astro-site/src/pages/pt/projetos/index.astro`
- `astro-site/src/pages/robots.txt.ts`

Added:

- `astro-site/src/components/ArticleListingPage.astro`
- `astro-site/src/components/PaginationNav.astro`
- `astro-site/src/components/ProjectListingPage.astro`
- `astro-site/src/lib/yanghua/pagination.ts`
- `astro-site/src/pages/llms-full.txt.ts`
- `astro-site/src/pages/en/articles/page/[page].astro`
- `astro-site/src/pages/es/articulos/page/[page].astro`
- `astro-site/src/pages/pt/artigos/page/[page].astro`
- `astro-site/src/pages/en/projects/page/[page].astro`
- `astro-site/src/pages/es/proyectos/page/[page].astro`
- `astro-site/src/pages/pt/projetos/page/[page].astro`

## Behavior changes

### 1) Article and project listing pagination

- Listing pages now paginate at 24 cards per page.
- Existing root routes remain page one:
  - `/en/articles`
  - `/es/articulos`
  - `/pt/artigos`
  - `/en/projects`
  - `/es/proyectos`
  - `/pt/projetos`
- Additional pages are emitted under `/page/2`, `/page/3`, etc.
- Hreflang and visible locale switching on paginated listing pages now only point to locales that actually have that page number.

### 2) Canonical, hreflang, and sitemap correctness

- Canonical generation follows the no-trailing-slash policy for indexable pages.
- Article hreflang links are emitted only from real `translationKey` relationships and only for pages that actually exist.
- `x-default` continues to resolve to English where a real English counterpart exists.
- Sitemap output is restricted to indexable/self-canonical pages and excludes invented alternate relationships.
- Article and paginated listing `lastmod` values are derived from real article content metadata, using normalized article `updatedAt` where available.

### 3) llms resources

- `llms.txt` content generation was expanded to remain locale-complete for public core pages and machine-readable resources.
- Added `llms-full.txt` route generation.
- Footer now exposes crawlable links to:
  - `/llms.txt`
  - `/llms-full.txt`
  - `/articles-map.json`
- `robots.txt` now explicitly allows `/llms-full.txt`.

### 4) FAQ normalization and schema parity

- Added FAQ normalization in article normalization flow.
- Visible FAQ sections and FAQ JSON-LD both consume the same normalized FAQ source.
- If an article does not yield a normalized FAQ set, neither visible FAQ nor FAQ schema is emitted.

### 5) Structured data updates

- Default layout schema now includes `Organization` and `WebSite`.
- `WebSite` schema now includes a `SearchAction` target.
- Breadcrumb schema now emits named breadcrumb items.
- Collection/listing pages emit `CollectionPage`/`ItemList` where appropriate.
- Article pages emit `Article`/`TechArticle` data with approved author handling:
  - `Person` only when author approval is approved and the approved author kind is `person`
  - fallback remains organizational authorship when person approval is not present
- Removed organization-level offer emission so unapproved product offer data is not surfaced.

## Verification run

Focused checks run after implementation:

1. `pnpm run check`
   - Passed

2. `pnpm run build`
   - Passed

3. `node --test tests/articles-core.test.mjs tests/seo-meta.test.mjs tests/seo-build-output.test.mjs`
   - Passed
   - 27 tests passed, 0 failed

## Notes and concerns

- I did not rewrite legacy article bodies or invent missing FAQ copy, author details, metrics, legal language, ratings, reviews, citations, or offer data.
- Approved `Person` author schema is emitted only where approval data explicitly allows it; pages without approved person author data continue using organizational authorship.
- Paginated hreflang relationships intentionally omit locale links for page numbers that do not exist in another locale to avoid false alternates.
