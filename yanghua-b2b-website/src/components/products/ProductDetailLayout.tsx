'use client';
import React from 'react';
import TechSpecsTable from './TechSpecsTable';
import ImageGallery from './ImageGallery';
import CTAButtons from './CTAButtons';
import type { Locale } from '@/lib/i18n';

export default function ProductDetailLayout({
  title,
  description,
  features,
  specs,
  images,
  locale,
  onQuoteOpen,
}: {
  title: string;
  description: string;
  features: string[];
  specs: { label: string; value: string }[];
  images: string[];
  locale: Locale;
  onQuoteOpen?: () => void;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-[#212529] mb-6">{title}</h1>
        <h2 className="text-xl text-[#6c757d] mb-8">{description}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ImageGallery images={images} />
          <div>
            <h3 className="text-2xl font-semibold text-[#212529] mb-4">Key Features</h3>
            <ul className="space-y-2 mb-8">
              {features.map((f, i) => (
                <li key={`${f}-${i}`} className="text-[#6c757d]">{f}</li>
              ))}
            </ul>
            <h3 className="text-2xl font-semibold text-[#212529] mb-4">Technical Specifications</h3>
            <TechSpecsTable items={specs} />
            <CTAButtons locale={locale} onQuoteOpen={onQuoteOpen} />
          </div>
        </div>
      </div>
    </div>
  );
}

