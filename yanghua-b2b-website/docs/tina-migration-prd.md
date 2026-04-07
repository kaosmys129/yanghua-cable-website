# Tina CMS Migration PRD

## Goal
- Remove all runtime dependency on Strapi Cloud and move article and hub content to repository-managed files.
- Keep the public URL structure, SEO outputs, security middleware, and form/email flows unchanged.
- Introduce a Tina-compatible content directory and schema for local editing and Git-based publishing.

## Scope
- Content source of truth moved to `content/`.
- Article list, article detail, hub list, hub detail, sitemap, and article API now read from the file-based content repository.
- Tina schema added in `tina/config.ts`.
- Strapi preview API disabled.
- Strapi-specific remote image handling removed from production runtime.

## Content Model
- `content/articles/{locale}/*.mdx`
- `content/hubs/{locale}/*.mdx`
- `content/pages/{locale}/*.json`
- `content/settings/site.json`

## Runtime Architecture
- `src/lib/content-repository.ts` is the new server-side data source.
- `src/lib/content-api.ts` is the runtime content facade used by pages and cached loaders.
- Client-side article queries fetch from `/api/articles` instead of importing server-only loaders.

## Delivery Notes
- `scripts/generate-content.ts` seeds the content directory from the existing in-repo article fixtures and translation files.
- `npm run content:generate` regenerates the file content baseline.
- `npm run build` must succeed without any `STRAPI_*` environment variables.
