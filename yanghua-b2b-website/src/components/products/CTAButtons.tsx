'use client';

import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import type { Locale } from '@/lib/i18n';

export default function CTAButtons({
  locale,
  onQuoteOpen,
}: {
  locale: Locale;
  onQuoteOpen?: () => void;
}) {
  const isEs = locale === 'es';

  return (
    <>
      <Button
        variant="default"
        size="lg"
        className="bg-[#fdb827] text-[#212529] hover:bg-[#e5a61e] font-semibold shadow-md hover:shadow-lg transition-all"
        onClick={() => onQuoteOpen?.()}
      >
        {isEs ? 'Solicitar Cotización' : 'Get Quote Now'}
      </Button>
      <Link href={`/${locale}/products`}>
        <Button variant="outline" size="lg" className="font-semibold">
          {isEs ? 'Explorar Productos' : 'Explore Products'}
        </Button>
      </Link>
    </>
  );
}
