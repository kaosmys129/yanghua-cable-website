import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check } from 'lucide-react';
import type { Locale } from '../../lib/yanghua/loaders';
import { route } from '../../lib/yanghua/routes';

interface FeatureItem {
  name?: string;
  description?: string;
}

interface ComparisonItem {
  name?: string;
  description?: string;
  features?: Record<string, FeatureItem>;
  image?: string;
  imageAlt?: string;
}

interface ProductComparisonProps {
  content?: {
    recommended?: string;
    title?: string;
    subtitle?: string;
    traditional?: ComparisonItem;
    compact?: ComparisonItem;
    flexibleBusbar?: ComparisonItem & { features?: Record<string, FeatureItem> };
    getQuote?: string;
    learnMore?: string;
  };
  /** i18n 翻译后的数据会自动带着 image 字段，也可以通过 props 显式传入覆盖 */
  traditionalImage?: string;
  traditionalImageAlt?: string;
  rigidBusbarImage?: string;
  rigidBusbarImageAlt?: string;
  locale?: Locale;
}

/** 每张卡片底部填充的图片高度（像素） */
const IMAGE_HEIGHT = 180;

export default function ProductComparisonSection({
  content = {},
  traditionalImage,
  traditionalImageAlt = 'Traditional armored cable',
  rigidBusbarImage,
  rigidBusbarImageAlt = 'Rigid busbar trunking system',
  locale = 'en',
}: ProductComparisonProps) {
  const {
    recommended = 'Recommended',
    title = 'Product Comparison',
    subtitle = 'See why flexible busbar outperforms traditional solutions',
    traditional,
    compact,
    flexibleBusbar,
    getQuote = 'Get Quote',
    learnMore = 'Learn More',
  } = content;

  const competitors = [traditional, compact].filter(Boolean);
  const flexible = flexibleBusbar ?? {};
  const flexibleFeatures = Object.values(flexible.features ?? {});

  // 前两张卡片各自的图片（props 优先，fallback 到 content 里的 image 字段）
  const competitorOverrideImages: (string | undefined)[] = [
    traditionalImage ?? (traditional as any)?.image,
    rigidBusbarImage ?? (compact as any)?.image,
  ];
  const competitorOverrideAlts: (string | undefined)[] = [
    traditionalImageAlt ?? (traditional as any)?.imageAlt,
    rigidBusbarImageAlt ?? (compact as any)?.imageAlt,
  ];

  const contactHref = route('contact', locale);
  const productsHref = route('products', locale);

  // If no content loaded, show empty state
  if (!competitors.length && !flexibleFeatures.length) {
    return null;
  }

  return (
    <section className="py-section">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="text-topper font-bold uppercase tracking-widest text-[hsl(var(--accent-shadcn))]">
            {recommended}
          </span>
          <h2 className="mt-2 font-heading text-h2 font-bold uppercase text-text">
            {title}
          </h2>
          <p className="mt-3 text-text-muted leading-relaxed">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Competitor Cards (前两张) */}
          {competitors.map((item: any, index) => {
            const img = competitorOverrideImages[index];
            const alt = competitorOverrideAlts[index] || item.name || '';

            return (
              <Card
                key={index}
                className="flex h-full flex-col overflow-hidden border-border bg-background shadow-sm"
              >
                {/* 文字内容 */}
                <CardContent className="flex flex-1 flex-col p-5 pb-3">
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-text">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      {item.description}
                    </p>
                  </div>
                  <ul className="mt-5 flex-1 space-y-3">
                    {Object.values(item.features ?? {})
                      .slice(0, 5)
                      .map((feature: any, fi: number) => (
                        <li
                          key={fi}
                          className="border-t border-border pt-3 first:border-0 first:pt-0"
                        >
                          <span className="block text-sm font-semibold text-text">
                            {feature.name}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-text-muted">
                            {feature.description}
                          </span>
                        </li>
                      ))}
                  </ul>
                </CardContent>

                {/* 底部产品图片（前两张卡片有，第三张柔性母线没有） */}
                <div
                  className="mt-auto w-full overflow-hidden px-5 pb-5"
                  style={{ height: IMAGE_HEIGHT + 20 }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={alt}
                      className="h-full w-full rounded-md object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-md bg-surface text-xs text-text-muted/50">
                      {item.name}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Highlighted Flexible Busbar Card (第三张 — 不展示底部图片) */}
          {flexible.name && (
            <Card className="relative flex h-full flex-col overflow-hidden border-[hsl(var(--accent-shadcn))/0.4] bg-primary text-primary-foreground shadow-lg">
              <CardContent className="flex flex-1 flex-col p-6">
                <div>
                  <Badge className="absolute right-4 top-4 bg-[hsl(var(--accent-shadcn))] text-[hsl(var(--accent-shadcn-foreground))] hover:bg-[hsl(var(--accent-shadcn))]/90">
                    {recommended}
                  </Badge>
                  <h3 className="pr-24 font-heading text-h3 font-bold uppercase">
                    {flexible.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
                    {flexible.description}
                  </p>
                </div>
                <ul className="mt-5 flex-1 space-y-3">
                  {flexibleFeatures.map((feature: any, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-md bg-primary-foreground/10 p-3"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--accent-shadcn))]" />
                      <div>
                        <span className="block text-sm font-semibold">
                          {feature.name}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-primary-foreground/75">
                          {feature.description}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6 flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Button
                    asChild
                    size="lg"
                    className="min-h-[44px] bg-[hsl(var(--accent-shadcn))] font-bold text-[hsl(var(--accent-shadcn-foreground))] hover:bg-[hsl(var(--accent-shadcn))]/90"
                  >
                    <a href={contactHref}>{getQuote}</a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="min-h-[44px] border-primary-foreground/40 font-bold text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <a href={productsHref}>{learnMore}</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
