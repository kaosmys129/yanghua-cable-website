import type { Article } from '@/lib/types';
import type { NormalizedGeoflowArticle } from './article';

type GeoArticleLike = Pick<NormalizedGeoflowArticle, 'title' | 'bodyMarkdown' | 'geo'> | Article;

export function generateGeoArticleFAQSchema(article: GeoArticleLike, articleUrl: string) {
  const faqs = article.geo?.faqs || [];
  if (!faqs.length) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${articleUrl}#geo-faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateGeoArticleHowToSchema(article: GeoArticleLike, articleUrl: string) {
  const body = 'bodyMarkdown' in article
    ? article.bodyMarkdown
    : article.blocks
        ?.filter((block) => block.__component === 'shared.rich-text')
        .map((block) => block.body)
        .join('\n') || '';

  const title = article.title;
  const buyerIntent = article.geo?.buyerIntent;
  const isGuide = buyerIntent === 'selection' || /\b(how to|choose|select|install|installation|guide)\b/i.test(`${title}\n${body}`);
  if (!isGuide) {
    return null;
  }

  const steps = extractNumberedSteps(body);
  if (!steps.length) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${articleUrl}#geo-howto`,
    name: title,
    step: steps.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text,
    })),
  };
}

function extractNumberedSteps(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.match(/^\d+\.\s+(.+)$/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line));
}
