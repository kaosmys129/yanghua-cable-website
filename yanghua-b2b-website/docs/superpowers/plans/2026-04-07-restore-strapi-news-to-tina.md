# Restore Strapi News To Tina Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the full historical Strapi news corpus into Tina content so English and Spanish article routes render the complete dataset again.

**Architecture:** Replace the demo article seed with a deterministic importer that converts local news JSON exports into Tina MDX files, then keep the existing article UI by mapping Tina frontmatter back into the current Strapi-compatible article shape. Add validation so content counts, slugs, bodies, and cross-locale links fail fast.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tina CMS file content, next-intl, Node content generation scripts

---

- [x] Replace article content generation input from `src/lib/data.ts` to local historical news JSON exports.
- [x] Add a dedicated news import helper that builds deterministic slugs, frontmatter, fallback bodies, and cross-locale mappings.
- [x] Regenerate `content/articles/en` and `content/articles/es` from the import pipeline.
- [x] Extend the content repository and article types with source URL and fallback metadata.
- [x] Localize article listing and detail-page UI strings that were still hard-coded in English.
- [x] Add validation for article counts, slugs, body presence, and English localization links for Spanish entries.
- [ ] Run content generation, validation, build, and key route verification.
