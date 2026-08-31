const ENGLISH_FALLBACK_HEADING = /^##\s+English Reference\s*$/im;
const FALLBACK_LOCALE_FIELD = /["']?fallbackLocale["']?\s*:\s*["']en["']/i;
const FALLBACK_BODY_SOURCE_FIELD = /["']?bodySource["']?\s*:\s*["']summary\+english-fallback["']/i;
const REMOTE_MARKDOWN_IMAGE = /!\[[^\]]*\]\(https?:\/\//i;

/**
 * @param {{ source?: string, body?: string, frontmatter?: Record<string, any> }} input
 * @returns {string[]}
 */
export function findSpanishArticleIssues(input = {}) {
  const source = String(input.source || '');
  const body = String(input.body || '');
  const frontmatter = input.frontmatter || {};
  const issues = [];

  if (frontmatter.fallbackLocale === 'en' || FALLBACK_LOCALE_FIELD.test(source)) {
    issues.push('fallbackLocale=en');
  }

  if (frontmatter.bodySource === 'summary+english-fallback' || FALLBACK_BODY_SOURCE_FIELD.test(source)) {
    issues.push('bodySource=summary+english-fallback');
  }

  if (ENGLISH_FALLBACK_HEADING.test(body) || ENGLISH_FALLBACK_HEADING.test(source)) {
    issues.push('English Reference section');
  }

  const coverSrc = frontmatter.cover?.src;
  if (typeof coverSrc === 'string' && /^https?:\/\//i.test(coverSrc)) {
    issues.push('remote cover image');
  }

  if (REMOTE_MARKDOWN_IMAGE.test(body) || REMOTE_MARKDOWN_IMAGE.test(source)) {
    issues.push('remote Markdown image');
  }

  return issues;
}

/**
 * Rejects the legacy English fallback before a Spanish article is written.
 * The locale is kept as an argument so English ingestion remains unchanged.
 *
 * @param {string} locale
 * @param {string} body
 */
export function assertSpanishArticleBody(locale, body) {
  if (locale !== 'es') return;

  const issues = findSpanishArticleIssues({ body });
  if (issues.length > 0) {
    throw new Error(`Spanish article body contains forbidden fallback content: ${issues.join(', ')}`);
  }
}

