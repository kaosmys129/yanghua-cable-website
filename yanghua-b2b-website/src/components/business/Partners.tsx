'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { InfiniteSlider } from '@/components/ui/InfiniteSlider';

export default function Partners() {
  const t = useTranslations('partners');
  const locale = useLocale();

  const partners = [
    { name: 'BYD', logo: '/images/partners/byd.webp' },
    { name: 'CATL', logo: '/images/partners/catl.webp' },
    { name: 'Huawei', logo: '/images/partners/huawei.webp' },
    { name: 'State Grid', logo: '/images/partners/state grid.webp' },
    { name: 'Power China', logo: '/images/partners/powerchina.webp' },
    { name: 'China Southern Power Grid', logo: '/images/partners/southern power grid.webp' },
    { name: 'PetroChina', logo: '/images/partners/oil china.webp' },
    { name: 'Sinopec', logo: '/images/partners/sinopec.webp' },
  ];

  return (
    <section className="py-16 lg:py-24 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">{t('title')}</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="relative overflow-hidden">
          <InfiniteSlider
            gap={24}
            duration={25}
            direction="horizontal"
            reverse={false}
            className="py-4"
          >
            {partners.map((partner, idx) => (
              <div
                key={`${partner.name}-${idx}`}
                className="h-16 w-36 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex-shrink-0 p-4"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    fill
                    className="object-contain transition-all duration-300"
                    sizes="9rem"
                    priority={idx < 4}
                  />
                </div>
              </div>
            ))}
          </InfiniteSlider>
        </div>
        <div className="mt-12 text-center">
          <Link href={`/${locale}/partners`} className="inline-flex items-center text-[#fdb827] hover:text-[#e0a020] font-medium transition-colors duration-200">
            {t('ctaAllPartners')} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}