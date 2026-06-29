'use client';

import React from 'react';
import TechSpecsTable from './TechSpecsTable';
import ImageGallery from './ImageGallery';
import CTAButtons from './CTAButtons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ExternalLink } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4 text-sm">
            {locale === 'es' ? 'Sistema de Barra Flexible' : 'Flexible Busbar System'}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{title}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">{description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <ImageGallery images={images} />

          {/* Details */}
          <div className="space-y-8">
            {/* Key Features */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {locale === 'es' ? 'Características Clave' : 'Key Features'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {features.map((f, i) => (
                    <li
                      key={`${f}-${i}`}
                      className="flex items-start gap-3 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <TechSpecsTable
              items={specs}
              title={locale === 'es' ? 'Especificaciones Técnicas' : 'Technical Specifications'}
            />

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <CTAButtons locale={locale} onQuoteOpen={onQuoteOpen} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
