import type { Locale } from './loaders';
import { normalizeProductHref, normalizeSolutionHref } from './link-normalizer';
import { route } from './routes';

export type GovernanceLink = {
  href: string;
  label: string;
  kind: 'solution' | 'product' | 'project' | 'article' | 'contact' | 'hub';
};

type ArticleLike = {
  slug: string;
  title: string;
  url: string;
  locale?: Locale;
  description?: string;
  summary?: string;
  geo?: {
    targetQueries?: string[];
    relatedProductIds?: string[];
    relatedSolutionIds?: string[];
  };
};

type HubLike = {
  slug: string;
  title: string;
  url: string;
};

type TopicRule = {
  id: string;
  terms: string[];
  solution: string;
  product: string;
  projectId: string;
  hub: string;
  solutionLabel: string;
  productLabel: string;
  projectLabel: string;
};

const TOPIC_RULES: TopicRule[] = [
  {
    id: 'data-center',
    terms: ['data center', 'datacenter', 'server farm', 'cloud facility', 'colocation', 'hyperscale'],
    solution: 'data-center',
    product: 'flexible-busbar',
    projectId: '1',
    hub: 'high-current-power-distribution',
    solutionLabel: 'Data center power distribution solution',
    productLabel: 'Flexible busbar product range',
    projectLabel: 'Huawei data center expansion project',
  },
  {
    id: 'energy-storage',
    terms: ['energy storage', 'battery energy', 'bess', 'battery cabinet', 'pcs', 'solar pv', 'photovoltaic'],
    solution: 'new-energy',
    product: 'flexible-busbar',
    projectId: '2',
    hub: 'energy-storage-busbar',
    solutionLabel: 'New energy and storage solution',
    productLabel: 'Flexible busbar product range',
    projectLabel: 'Energy storage power distribution project',
  },
  {
    id: 'ev-charging',
    terms: ['ev charging', 'charging station', 'charging pile', 'fast charging', 'electric vehicle'],
    solution: 'charging-station',
    product: 'flexible-busbar',
    projectId: '2',
    hub: 'ev-charging-busbar',
    solutionLabel: 'EV charging station solution',
    productLabel: 'Flexible busbar product range',
    projectLabel: 'New energy power distribution project',
  },
  {
    id: 'comparison',
    terms: ['parallel cable', 'multiple cable', 'busduct', 'cable tray', 'vs cable', 'comparison', 'tco'],
    solution: 'power-system',
    product: 'flexible-busbar',
    projectId: '1',
    hub: 'flexible-busbar-vs-cable',
    solutionLabel: 'High-current power distribution solution',
    productLabel: 'Flexible busbar product range',
    projectLabel: 'High-current distribution project example',
  },
  {
    id: 'manufacturing',
    terms: ['manufacturing', 'industrial plant', 'factory', 'automation', 'chemical plant', 'steel mill'],
    solution: 'manufacturing',
    product: 'flexible-busbar',
    projectId: '3',
    hub: 'retrofit-fast-installation',
    solutionLabel: 'Manufacturing power distribution solution',
    productLabel: 'Flexible busbar product range',
    projectLabel: 'Industrial manufacturing project',
  },
  {
    id: 'general',
    terms: ['flexible busbar', 'high current', 'power distribution', 'installation', 'manufacturer', 'supplier'],
    solution: 'power-system',
    product: 'flexible-busbar',
    projectId: '1',
    hub: 'high-current-power-distribution',
    solutionLabel: 'High-current power distribution solution',
    productLabel: 'Flexible busbar product range',
    projectLabel: 'High-current distribution project example',
  },
];

const STOP_WORDS = new Set([
  'about', 'after', 'against', 'article', 'busbar', 'current', 'flexible', 'from', 'guide', 'high',
  'into', 'power', 'the', 'this', 'using', 'with', 'yanghua', 'yanghuasti',
]);

function asText(value: unknown): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function topicText(article: ArticleLike): string {
  return asText([
    article.slug,
    article.title,
    article.description,
    article.summary,
    ...(article.geo?.targetQueries ?? []),
  ].join(' '));
}

export function classifyArticleTopic(article: ArticleLike): TopicRule {
  const text = topicText(article);
  return TOPIC_RULES.find((rule) => rule.terms.some((term) => text.includes(term))) ?? TOPIC_RULES[TOPIC_RULES.length - 1];
}

function localizedLabel(locale: Locale, labels: { en: string; es: string; pt: string }): string {
  return labels[locale];
}

export function buildArticlePathways(article: ArticleLike, locale: Locale = 'en'): GovernanceLink[] {
  const topic = classifyArticleTopic(article);
  const productId = article.geo?.relatedProductIds?.[0] ?? topic.product;
  const solutionId = article.geo?.relatedSolutionIds?.[0] ?? topic.solution;
  const projectBase = route('projects', locale);

  return [
    { kind: 'solution', href: normalizeSolutionHref(solutionId, locale), label: localizedLabel(locale, { en: topic.solutionLabel, es: 'Solución de distribución eléctrica', pt: 'Solução de distribuição elétrica' }) },
    { kind: 'product', href: normalizeProductHref(productId, locale), label: localizedLabel(locale, { en: topic.productLabel, es: 'Gama de barras colectoras flexibles', pt: 'Linha de barramentos flexíveis' }) },
    { kind: 'project', href: `${projectBase}/${topic.projectId}`, label: localizedLabel(locale, { en: topic.projectLabel, es: 'Evidencia de proyecto', pt: 'Evidência de projeto' }) },
    { kind: 'contact', href: route('contact', locale), label: localizedLabel(locale, { en: 'Request an engineering quotation', es: 'Solicitar una cotización técnica', pt: 'Solicitar uma cotação técnica' }) },
    { kind: 'hub', href: `${route('hubs', locale)}/${topic.hub}`, label: localizedLabel(locale, { en: 'Explore this topic hub', es: 'Explorar este hub técnico', pt: 'Explorar este hub técnico' }) },
  ];
}

export function buildHubPathways(hub: HubLike, locale: Locale = 'en'): GovernanceLink[] {
  const topic = TOPIC_RULES.find((rule) => rule.hub === hub.slug) ?? TOPIC_RULES[TOPIC_RULES.length - 1];
  const projectBase = route('projects', locale);
  return [
    { kind: 'solution', href: normalizeSolutionHref(topic.solution, locale), label: localizedLabel(locale, { en: topic.solutionLabel, es: 'Solución de distribución eléctrica', pt: 'Solução de distribuição elétrica' }) },
    { kind: 'product', href: normalizeProductHref(topic.product, locale), label: localizedLabel(locale, { en: topic.productLabel, es: 'Gama de barras colectoras flexibles', pt: 'Linha de barramentos flexíveis' }) },
    { kind: 'project', href: `${projectBase}/${topic.projectId}`, label: localizedLabel(locale, { en: topic.projectLabel, es: 'Evidencia de proyecto', pt: 'Evidência de projeto' }) },
    { kind: 'contact', href: route('contact', locale), label: localizedLabel(locale, { en: 'Discuss your project requirements', es: 'Comentar los requisitos del proyecto', pt: 'Falar sobre os requisitos do projeto' }) },
  ];
}

export function getRelatedArticles(article: ArticleLike, articles: ArticleLike[], limit = 4): ArticleLike[] {
  const topic = classifyArticleTopic(article);
  const sourceTokens = new Set(
    topicText(article)
      .split(' ')
      .filter((token) => token.length > 4 && !STOP_WORDS.has(token)),
  );

  return articles
    .filter((candidate) => candidate.locale === (article.locale ?? 'en') && candidate.slug !== article.slug)
    .map((candidate) => {
      const candidateText = topicText(candidate);
      const sharedTokens = candidateText.split(' ').filter((token) => sourceTokens.has(token)).length;
      const sameTopic = classifyArticleTopic(candidate).id === topic.id ? 5 : 0;
      const queryMatch = (article.geo?.targetQueries ?? []).some((query) => candidateText.includes(asText(query))) ? 3 : 0;
      return { candidate, score: sameTopic + sharedTokens + queryMatch };
    })
    .sort((left, right) => right.score - left.score || left.candidate.title.localeCompare(right.candidate.title))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function buildBreadcrumbs(items: Array<{ name: string; href?: string }>) {
  return items.map((item, index) => ({ ...item, current: index === items.length - 1 }));
}
