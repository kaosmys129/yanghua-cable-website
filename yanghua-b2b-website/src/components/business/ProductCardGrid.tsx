'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Locale } from '@/lib/i18n';

interface ProductCardGridProps {
  locale?: 'en' | 'es';
  className?: string;
  onQuoteOpen?: () => void;
}

/**
 * ProductCardGrid
 * - Renders a 4-column grid of product category cards
 * - Data source: messages -> products.categories (first 4 items)
 * - Links: /[locale]/products/category/[name] using url-localization helper
 */
export default function ProductCardGrid({ locale: propLocale, className, onQuoteOpen }: ProductCardGridProps) {
  const t = useTranslations('products');
  const currentLocale = (propLocale || useLocale()) as Locale;

  // Map category index to route slug keys used by products/category/[name]
  const indexToSlug: Record<number, string> = {
    0: 'general',
    1: 'flame-retardant',
    2: 'fire-resistant',
    3: 'low-smoke-halogen-free'
  };

  const categories = Array.from({ length: 4 }).map((_, i) => {
    const name = t(`categories.${i}.name`);
    const description = t(`categories.${i}.description`);
    const imageSrc = `/images/product-center/${i}.jpg`;
    const slug = indexToSlug[i] || encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
    const href = buildLocalizedUrl('products-category', currentLocale, { name: slug });
    return { i, name, description, imageSrc, href };
  });

  return (
    <section className={`py-8 ${className || ''}`.trim()}>
      {/* 恢复非全屏容器（遵循页面的标准布局宽度） */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#212529]">
            {t('overview.title')}
          </h2>
        </div>

        {/* 网格布局：2 行 2 列，四张卡片整齐排列 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {categories.map((cat, idx) => (
            <Link key={idx} href={cat.href} className="group block">
              <div className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden h-full">
                <div className="relative w-full h-40">
                  <Image
                    src={cat.imageSrc}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL="/images/no-image-available.webp"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-[#212529] mb-2 group-hover:text-[#fdb827] transition-colors">
                    {cat.name}
                  </h3>
                  {/* Show full description (remove line clamp) */}
                  <p className="text-sm text-[#6c757d]">{cat.description}</p>
                  <div className="mt-4">
                    <span
                      className="inline-block text-sm font-medium text-[#212529] bg-[#fdb827] hover:bg-[#e0a020] text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
                      onClick={(e) => {
                        // Prevent navigating the parent Link when CTA is clicked
                        e.preventDefault();
                        e.stopPropagation();
                        onQuoteOpen?.();
                      }}
                    >
                      Get Quote
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}