import React from 'react';
import { Card, CardContent } from '../ui/card';

interface Partner {
  name: string;
  logo: string;
}

interface PartnersSectionProps {
  title?: string;
  subtitle?: string;
  partners?: Partner[];
  benefits?: { title: string; description: string }[];
}

export default function PartnersSection({
  title = 'Our Partners',
  subtitle = 'Trusted by industry leaders worldwide',
  partners = [],
  benefits = [],
}: PartnersSectionProps) {
  return (
    <section className="bg-surface py-section">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="font-heading text-h2 font-bold uppercase text-text">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-text-muted leading-relaxed">{subtitle}</p>
          )}
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {partners.map((p) => (
            <Card
              key={p.name}
              className="flex min-h-28 items-center justify-center border-border bg-background p-5 shadow-sm"
            >
              <CardContent className="p-0">
                <img
                  src={p.logo}
                  alt={p.name}
                  className="max-h-16 max-w-full object-contain grayscale transition-all duration-300 hover:grayscale-0"
                  loading="lazy"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Row */}
        {benefits.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {benefits.map((item) => (
              <Card key={item.title} className="border-border bg-background p-6 shadow-sm">
                <CardContent className="p-0">
                  <h3 className="font-heading text-lg font-semibold text-text">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
