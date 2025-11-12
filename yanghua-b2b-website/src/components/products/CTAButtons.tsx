'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Locale } from '@/lib/i18n';

export default function CTAButtons({ locale, onQuoteOpen }: { locale: Locale; onQuoteOpen?: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
      <Link
        href={buildLocalizedUrl('contact', locale)}
        className="btn-primary inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto"
        onClick={(e) => {
          if (onQuoteOpen) {
            e.preventDefault();
            onQuoteOpen();
          }
        }}
      >
        Get Quote Now
        <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
      </Link>
      <Link
        href={buildLocalizedUrl('products', locale)}
        className="btn-secondary inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto"
        onClick={(e) => {
          if (onQuoteOpen) {
            e.preventDefault();
            onQuoteOpen();
          }
        }}
      >
        Explore Products
      </Link>
    </div>
  );
}

