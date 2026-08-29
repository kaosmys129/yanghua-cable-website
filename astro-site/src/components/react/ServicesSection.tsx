import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ArrowRight } from 'lucide-react';
import type { Locale } from '../../lib/yanghua/loaders';
import { route } from '../../lib/yanghua/routes';

interface ServiceItem {
  title: string;
  description: string;
  href?: string;
  image?: string;
  mobileImage?: string;
  imageAlt?: string;
}

interface ServicesSectionProps {
  topper?: string;
  heading?: string;
  description?: string;
  services?: ServiceItem[];
  locale?: Locale;
}

const defaultServices: ServiceItem[] = [
  { title: 'General Repairs', description: 'Reliable fixes for plumbing, electrical, drywall — done right.' },
  { title: 'Installations', description: 'Professional installation of fixtures, appliances, and systems.' },
  { title: 'Inspections', description: 'Thorough property inspections to catch issues early.' },
  { title: 'Remodeling', description: 'Transform kitchens, bathrooms, and living spaces.' },
  { title: 'Emergency Service', description: '24/7 emergency response when you need help fast.' },
  { title: 'Maintenance Plans', description: 'Scheduled preventive maintenance to protect your property.' },
];

const icons = [
  <svg key="0" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  <svg key="1" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>,
  <svg key="2" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>,
  <svg key="3" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>,
  <svg key="4" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>,
  <svg key="5" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
];

export default function ServicesSection({
  topper = 'What We Do',
  heading = 'Our Services',
  description = 'From routine maintenance to complex projects, we deliver quality workmanship.',
  services = defaultServices,
  locale = 'en',
}: ServicesSectionProps) {
  return (
    <section className="bg-surface py-section">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center lg:mb-14">
          <span className="text-topper font-bold uppercase tracking-widest text-[hsl(var(--accent-shadcn))]">
            {topper}
          </span>
          <h2 className="mt-2 font-heading text-h2 font-bold uppercase text-text">
            {heading}
          </h2>
          <p className="mt-3 text-text-muted leading-relaxed">{description}</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <a
              key={service.title}
              href={service.href || route('services', locale)}
              aria-label={`Learn more about ${service.title}`}
              className="group"
            >
              <Card className="relative flex min-h-64 cursor-pointer flex-col overflow-hidden border-border bg-background p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
                {service.image && (
                  <>
                    <picture>
                      {service.mobileImage && <source media="(max-width: 640px)" srcSet={service.mobileImage} />}
                      <img
                        src={service.image}
                        alt={service.imageAlt || service.title}
                        width="1280"
                        height="720"
                        className="absolute inset-0 h-full w-full object-cover opacity-[0.22] saturate-90 transition duration-300 group-hover:scale-105 group-hover:opacity-[0.3]"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <span className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70" />
                  </>
                )}
                <div className="relative mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {icons[i % icons.length]}
                </div>
                <h3 className="relative font-heading text-h3 font-semibold text-text">
                  {service.title}
                </h3>
                <p className="relative mt-2 flex-1 text-sm leading-relaxed text-text-muted">
                  {service.description}
                </p>
                <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors group-hover:text-[hsl(var(--accent-shadcn))]">
                  Learn more
                  <span className="sr-only"> about {service.title}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
