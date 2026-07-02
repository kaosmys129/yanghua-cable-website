# GEOFlow Articles Integration

This site treats GEOFlow as the upstream GEO content engineering and review system. The Next.js articles module remains the public rendering layer.

## Endpoints

- Health check: `GET /api/geoflow/v1/health`
- Article ingestion: `POST /api/geoflow/v1/articles`
- AI-readable article map: `GET /api/geoflow/v1/articles-map`
- AI site context: `GET /llms.txt`

## HMAC Headers

GEOFlow can use the native `generic_http_api` publisher. The receiver accepts both the upstream raw-hex format and the older `sha256={hex}` format.

- `x-geoflow-key-id`
- `x-geoflow-timestamp`
- `x-geoflow-nonce`
- `x-geoflow-body-sha256` or `x-geoflow-payload-sha256`
- `x-geoflow-signature`
- `x-geoflow-idempotency-key`, `idempotency-key`, or `x-idempotency-key`

The canonical signature string is:

```text
POST
/api/geoflow/v1/articles
{x-geoflow-timestamp}
{x-geoflow-nonce}
{x-geoflow-body-sha256}
```

`x-geoflow-timestamp` may be an ISO timestamp or Unix seconds. Configure secrets with `GEOFLOW_HMAC_KEYS`.

## GEOFlow Channel Settings

Create a Generic HTTP API channel in GEOFlow:

- Name: `Yanghua Next Articles`
- Auth type: `hmac`
- Health path: `GET /api/geoflow/v1/health`
- Publish path: `POST /api/geoflow/v1/articles`
- Update path: reuse `POST /api/geoflow/v1/articles` for v1 idempotent imports
- Delete path: leave unused for v1
- Remote ID response path: `remoteId`
- Remote URL response path: `remoteUrl`
- Payload wrapper: `none`

Use the production Yanghua origin for production, and a local/staging origin for testing. For Docker-based GEOFlow talking to a local Next.js server, the origin is usually `http://host.docker.internal:{port}`.

### Local Docker Channel Bootstrap

For the cloned `yaojingang/GEOFlow` app used next to this repository:

1. Start Yanghua locally on port `3011`:

   ```bash
   npm run legacy:next:dev:playwright
   ```

2. Add a local-only HMAC key in `.env.local`:

   ```bash
   GEOFLOW_HMAC_KEYS="gapi_yanghua_next_local:{long-random-secret}"
   ```

3. In the GEOFlow checkout, create or refresh the local channel:

   ```bash
   docker exec \
     -e YANGHUA_GEOFLOW_KEY_ID=gapi_yanghua_next_local \
     -e YANGHUA_GEOFLOW_SECRET="{same-long-random-secret}" \
     -e YANGHUA_GEOFLOW_ENDPOINT=http://host.docker.internal:3011 \
     geoflow-app php scripts/yanghua-upsert-channel.php
   ```

4. Verify the channel health from GEOFlow:

   ```bash
   docker exec geoflow-app php scripts/yanghua-publish-smoke.php
   ```

The smoke command sends one temporary article through GEOFlow's real Generic HTTP API publisher. After verifying `_incoming`, remove the smoke MDX and log entry before continuing real editorial work.

The global site middleware intentionally skips CSRF and JSON body rewriting for `/api/geoflow/*`; these routes are protected by their own HMAC verification. Do not remove that exception unless the GEOFlow receiver is changed to validate the rewritten body.

## Review Flow

1. GEOFlow generates or imports an approved article.
2. The site verifies HMAC, timestamp, nonce and idempotency key.
3. The article is written to `content/articles/_incoming/{locale}/geoflow-{slug}.mdx`.
4. A human reviews the MDX file and source material.
5. Run `npm run geoflow:promote` to move reviewed files into `content/articles/{locale}/`.
6. Run article checks before deployment.

## Existing Article Rewrite Workflow

Use GEOFlow to rebuild existing articles without changing public URLs:

1. Import existing Yanghua articles into the GEOFlow knowledge base as source material, grouped by locale and topic.
2. Classify articles before rewriting:
   - A: high buyer intent technical articles, such as busbar vs cable, energy storage, solar PV, EV charging and industrial distribution.
   - B: project and case articles, rewritten into problem, solution, parameters, results and FAQ.
   - C: events, holiday notices and company updates, lightly enhanced only when they support authority.
3. In the GEOFlow task prompt, require the original slug and locale to be preserved.
4. Require the hidden `yanghua-geo-json` block for every rewritten article.
5. Send approved drafts to Yanghua through the Generic HTTP API channel.
6. Review `_incoming` MDX against the original article and source material.
7. Promote with `npm run geoflow:promote -- --overwrite` only after human review when replacing an existing URL.

First rewrite batch: 10 English A-class articles. Second batch: remaining high-intent English articles. Third batch: Spanish priority equivalents.

Generate the first rewrite bundle locally:

```bash
npm run geoflow:export-rewrite-bundle -- --out /tmp/yanghua-geoflow-rewrite-en-ab --locale en --priority A,B --limit 10 --site-url https://www.yhflexiblebusbar.com
```

The export includes:

- `summary.md`: human review list for the first batch.
- `knowledge-base.jsonl`: source material rows for the Yanghua GEOFlow knowledge base.
- `rewrite-tasks.jsonl`: structured rewrite task list.
- `prompts/*.md`: one GEOFlow prompt plus source material file per article.

Use A/B tasks for the first manual rewrite sprint. C tasks are company/event authority refreshes and should not consume the first month GEO publishing slots.

## Payload Policy

The receiver accepts either the Yanghua flat article payload or GEOFlow's native payload:

```json
{
  "version": "1.0",
  "source": "geoflow",
  "event": "article.publish",
  "article": {
    "id": 1,
    "title": "Energy Storage Busbar Selection Guide",
    "slug": "energy-storage-busbar-selection-guide",
    "excerpt": "Short summary",
    "content": "Markdown body",
    "keywords": "energy storage busbar, BESS flexible busbar",
    "meta_description": "SEO description",
    "published_at": "2026-06-30T08:00:00.000Z",
    "updated_at": "2026-06-30T09:00:00.000Z"
  }
}
```

Every GEOFlow article should include a hidden metadata block at the end of Markdown:

```html
<!-- yanghua-geo-json
{
  "locale": "en",
  "slug": "original-yanghua-article-slug",
  "geo": {
    "targetQueries": ["flexible busbar vs cable"],
    "answerSummary": "40-80 word direct answer for AI extraction.",
    "faqs": [{ "question": "Question", "answer": "Answer" }],
    "citations": [{ "label": "Yanghua engineering knowledge base", "note": "Source note" }],
    "sourceMaterials": ["Yanghua product catalog"],
    "buyerIntent": "selection",
    "relatedProductIds": ["flexible-busbar"],
    "relatedSolutionIds": ["energy-storage"]
  },
  "seo": {
    "title": "SEO title",
    "description": "SEO description",
    "keywords": ["flexible busbar"]
  }
}
-->
```

The importer strips this comment from the public article body and writes the values into MDX frontmatter. If the block is missing, the article is stored in `_incoming` with `geoflow.reviewStatus: needs_geo_metadata`, and `npm run geoflow:promote` will skip it.

For existing article rewrites, `locale` and `slug` in the hidden block are treated as the source of truth for Yanghua import. This preserves the public URL even if GEOFlow generated the internal article slug from a rewritten title.

Every published GEOFlow article should include:

- Direct answer summary for AI extraction.
- Buyer-intent classification: `awareness`, `comparison`, `selection`, or `procurement`.
- Target queries and FAQ entries.
- Citations or source materials based on real Yanghua product, project or engineering knowledge.
- Internal links through `relatedProductIds` and `relatedSolutionIds`.

Do not use GEOFlow to publish unsupported bulk content. The goal is citable, reviewable engineering content.
