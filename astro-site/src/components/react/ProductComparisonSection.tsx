import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check } from 'lucide-react';

interface FeatureItem {
  name?: string;
  description?: string;
}

interface ComparisonItem {
  name?: string;
  description?: string;
  features?: Record<string, FeatureItem>;
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
  locale?: string;
}

export default function ProductComparisonSection({
  content = {},
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

  const contactHref = locale === 'es' ? '/es/contacto' : '/en/contact';
  const productsHref = locale === 'es' ? '/es/productos' : '/en/products';

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
          {/* Competitor Cards */}
          {competitors.map((item: any, index) => (
            <Card key={index} className="flex h-full flex-col border-border bg-background shadow-sm">
              <CardContent className="flex flex-1 flex-col p-5">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-text">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.description}</p>
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
            </Card>
          ))}

          {/* Highlighted Flexible Busbar Card */}
          {flexible.name && (
            <Card className="flex h-full flex-col relative overflow-hidden border-[hsl(var(--accent-shadcn))/0.4] bg-primary text-primary-foreground shadow-lg">
              <CardContent className="flex flex-1 flex-col p-6">
                <div>
                  <Badge className="absolute right-4 top-4 bg-[hsl(var(--accent-shadcn))] text-[hsl(var(--accent-shadcn-foreground))] hover:bg-[hsl(var(--accent-shadcn))]/90">
                    {recommended}
                  </Badge>
                  <h3 className="pr-24 font-heading text-h3 font-bold uppercase">
                    {flexible.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">{flexible.description}</p>
                </div>
                <ul className="mt-5 flex-1 space-y-3">
                  {flexibleFeatures.map((feature: any, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 rounded-md bg-primary-foreground/10 p-3"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--accent-shadcn))]" />
                      <div>
                        <span className="block text-sm font-semibold">{feature.name}</span>
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
