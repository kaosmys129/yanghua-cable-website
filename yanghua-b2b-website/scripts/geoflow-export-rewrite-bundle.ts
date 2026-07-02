import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import {
  buildGeoRewriteBundle,
  type GeoRewriteArticleInput,
  type GeoRewriteLocale,
  type GeoRewritePriorityClass,
} from '../src/lib/geoflow/rewrite-export.ts';

type CliOptions = {
  outDir: string;
  siteUrl: string;
  locales: GeoRewriteLocale[];
  priorities: GeoRewritePriorityClass[];
  limit?: number;
};

const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yhflexiblebusbar.com';

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    outDir: path.join(process.cwd(), 'exports', 'geoflow-rewrite-bundle'),
    siteUrl: defaultSiteUrl,
    locales: ['en', 'es'],
    priorities: ['A', 'B', 'C'],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--out' && next) {
      options.outDir = path.resolve(next);
      index += 1;
    } else if (arg === '--site-url' && next) {
      options.siteUrl = next;
      index += 1;
    } else if (arg === '--locale' && next) {
      options.locales = next
        .split(',')
        .map((value) => value.trim())
        .filter((value): value is GeoRewriteLocale => value === 'en' || value === 'es');
      index += 1;
    } else if (arg === '--priority' && next) {
      options.priorities = next
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter((value): value is GeoRewritePriorityClass => value === 'A' || value === 'B' || value === 'C');
      index += 1;
    } else if (arg === '--limit' && next) {
      const parsed = Number.parseInt(next, 10);
      options.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
      index += 1;
    }
  }

  if (options.locales.length === 0) {
    throw new Error('No valid locales selected. Use --locale en,es');
  }
  if (options.priorities.length === 0) {
    throw new Error('No valid priorities selected. Use --priority A,B,C');
  }

  return options;
}

function readArticles(locales: GeoRewriteLocale[]): GeoRewriteArticleInput[] {
  return locales.flatMap((locale) => {
    const localeDir = path.join(process.cwd(), 'content', 'articles', locale);
    if (!fs.existsSync(localeDir)) {
      return [];
    }

    return fs
      .readdirSync(localeDir)
      .filter((entry) => entry.endsWith('.mdx'))
      .map((entry) => readArticleFile(locale, path.join(localeDir, entry)));
  });
}

function readArticleFile(locale: GeoRewriteLocale, filePath: string): GeoRewriteArticleInput {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data;

  return {
    locale,
    slug: String(data.slug || path.basename(filePath, '.mdx')),
    title: String(data.title || path.basename(filePath, '.mdx')),
    description: String(data.description || data.title || ''),
    body: parsed.content.trim(),
    publishedAt: String(data.publishedAt || data.updatedAt || data.createdAt || ''),
    updatedAt: String(data.updatedAt || data.publishedAt || data.createdAt || ''),
    translationKey: String(data.translationKey || `${locale}-${path.basename(filePath, '.mdx')}`),
    sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : undefined,
    category: data.category
      ? {
          name: String(data.category.name || 'News'),
          slug: String(data.category.slug || 'news'),
        }
      : undefined,
    relatedSlugs: Array.isArray(data.relatedSlugs) ? data.relatedSlugs.map(String) : [],
  };
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeJsonl(filePath: string, values: unknown[]) {
  fs.writeFileSync(filePath, `${values.map((value) => JSON.stringify(value)).join('\n')}\n`, 'utf8');
}

function writePromptFiles(outDir: string, tasks: ReturnType<typeof buildGeoRewriteBundle>['tasks']) {
  const promptDir = path.join(outDir, 'prompts');
  fs.mkdirSync(promptDir, { recursive: true });

  tasks.forEach((task, index) => {
    const fileName = `${String(index + 1).padStart(3, '0')}-${task.priorityClass}-${task.locale}-${task.slug}.md`;
    fs.writeFileSync(
      path.join(promptDir, fileName),
      [
        `# ${task.title}`,
        '',
        '## GEOFlow Rewrite Prompt',
        '',
        task.prompt,
        '',
        '## Source Material',
        '',
        task.sourceMarkdown,
      ].join('\n'),
      'utf8'
    );
  });
}

function buildKnowledgeRows(tasks: ReturnType<typeof buildGeoRewriteBundle>['tasks']) {
  return tasks.map((task) => ({
    id: `${task.locale}:${task.slug}`,
    title: task.title,
    locale: task.locale,
    url: task.publicUrl,
    sourceUrl: task.sourceUrl,
    priorityClass: task.priorityClass,
    rewriteMode: task.rewriteMode,
    buyerIntent: task.buyerIntent,
    topicSlugs: task.topicSlugs,
    targetQueries: task.targetQueries,
    content: task.sourceMarkdown,
  }));
}

function buildSummaryMarkdown(bundle: ReturnType<typeof buildGeoRewriteBundle>) {
  const topTasks = bundle.tasks.slice(0, 20);

  return [
    '# Yanghua GEOFlow Article Rewrite Bundle',
    '',
    `Generated at: ${bundle.generatedAt}`,
    `Site URL: ${bundle.siteUrl}`,
    '',
    '## Summary',
    '',
    `- Total tasks: ${bundle.summary.total}`,
    `- A priority: ${bundle.summary.byPriority.A}`,
    `- B priority: ${bundle.summary.byPriority.B}`,
    `- C priority: ${bundle.summary.byPriority.C}`,
    `- English: ${bundle.summary.byLocale.en}`,
    `- Spanish: ${bundle.summary.byLocale.es}`,
    '',
    '## First 20 Tasks',
    '',
    ...topTasks.map(
      (task, index) =>
        `${index + 1}. [${task.priorityClass}] ${task.locale} - ${task.title}\n   URL: ${task.publicUrl}\n   Queries: ${task.targetQueries.join('; ')}`
    ),
    '',
    '## GEOFlow Import Notes',
    '',
    '- Use `knowledge-base.jsonl` as source material for the Yanghua knowledge base.',
    '- Use files under `prompts/` to create rewrite tasks in GEOFlow.',
    '- Preserve each original slug and locale when publishing back to Yanghua.',
    '- Every approved rewrite must end with the hidden `yanghua-geo-json` block.',
  ].join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const articles = readArticles(options.locales);
  const bundle = buildGeoRewriteBundle(articles, options.siteUrl);
  const filteredTasks = bundle.tasks
    .filter((task) => options.priorities.includes(task.priorityClass))
    .slice(0, options.limit || Number.POSITIVE_INFINITY);
  const filteredBundle = buildGeoRewriteBundle(
    filteredTasks.map((task) => ({
      locale: task.locale,
      slug: task.slug,
      title: task.title,
      description: task.description,
      body: task.sourceMarkdown,
      publishedAt: task.publishedAt,
      updatedAt: task.updatedAt,
      translationKey: task.translationKey,
      sourceUrl: task.sourceUrl,
      category: { name: 'GEO Rewrite Source', slug: 'geo-rewrite-source' },
    })),
    options.siteUrl
  );
  filteredBundle.tasks = filteredTasks;
  filteredBundle.summary = {
    total: filteredTasks.length,
    byPriority: {
      A: filteredTasks.filter((task) => task.priorityClass === 'A').length,
      B: filteredTasks.filter((task) => task.priorityClass === 'B').length,
      C: filteredTasks.filter((task) => task.priorityClass === 'C').length,
    },
    byLocale: {
      en: filteredTasks.filter((task) => task.locale === 'en').length,
      es: filteredTasks.filter((task) => task.locale === 'es').length,
    },
  };

  fs.mkdirSync(options.outDir, { recursive: true });
  writeJson(path.join(options.outDir, 'rewrite-bundle.json'), filteredBundle);
  writeJsonl(path.join(options.outDir, 'rewrite-tasks.jsonl'), filteredBundle.tasks);
  writeJsonl(path.join(options.outDir, 'knowledge-base.jsonl'), buildKnowledgeRows(filteredBundle.tasks));
  writePromptFiles(options.outDir, filteredBundle.tasks);
  fs.writeFileSync(path.join(options.outDir, 'summary.md'), buildSummaryMarkdown(filteredBundle), 'utf8');

  console.log(
    JSON.stringify(
      {
        ok: true,
        outDir: options.outDir,
        total: filteredBundle.summary.total,
        byPriority: filteredBundle.summary.byPriority,
        byLocale: filteredBundle.summary.byLocale,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
