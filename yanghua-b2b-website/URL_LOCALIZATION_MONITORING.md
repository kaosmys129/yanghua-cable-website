Localized URL Monitoring & Prevention

Overview
- Goal: Ensure Spanish site paths use translated segments (e.g., /es/productos, /es/soluciones) and avoid English segments under /es (e.g., /es/products, /es/solutions).
- Why: Prevent duplicate URLs, enforce canonical structure, and maintain hreflang/canonical consistency across the site.

What We Enforce
- Canonical and hreflang alternates must be built via utility functions (buildLocalizedUrl, generateCanonicalUrl).
- Robots (production) disallow crawling of English segments under /es.
- Middleware redirects English-segment ES paths to Spanish translations and rewrites Spanish dynamic paths to internal routes.

Continuous Check Script
- Location: scripts/check-localized-urls.js
- Purpose: Scan source code for any hard-coded English segments under /es and fail the check if found.

Run Locally
- npm run check:urls
  - Exit 0: OK
  - Exit 1: Violations detected with a file/line report.

CI Integration (example)
- Add a workflow step:
  - name: Check localized URLs
    run: npm run check:urls
  - Recommended to run after lint and before build/deploy.

Allowlisted files
- src/middleware.ts (contains redirect/rewrite rules that mention English segments intentionally)
- src/app/robots.ts (contains disallow list for English segments intentionally)

Developer Guidelines
- Do NOT hard-code /es/<english-segment> in pages, layouts, or metadata.
- Use buildLocalizedUrl when generating canonical and hreflang alternates.
- When adding new pages:
  - Update LOCALIZED_PATHS in src/lib/url-localization.ts
  - Ensure middleware pathnames include the route if needed
  - Validate with npm run check:urls

Troubleshooting
- If the check flags a page:
  1) Replace hard-coded URLs with buildLocalizedUrl/translateUrl
  2) If it’s a legitimate case (e.g., robots, middleware), consider adding to ALLOWLIST_PATHS in the script.
  3) Re-run npm run check:urls

Ownership
- This check is part of the “URL Optimization & i18n” maintenance. Keep it updated when new locales or routes are added.