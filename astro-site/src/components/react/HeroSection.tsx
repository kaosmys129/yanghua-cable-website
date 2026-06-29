import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowRight, Phone } from 'lucide-react';

interface HeroSectionProps {
  topper?: string;
  heading?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  imageSrc?: string;
  imageAlt?: string;
  phone?: string;
  phoneHref?: string;
}

export default function HeroSection({
  topper,
  heading = 'Flexible busbar and cable solutions',
  description = 'Leading manufacturer of flexible busbars and cable solutions for industrial applications.',
  ctaLabel = 'View Products',
  ctaHref = '/en/products',
  secondaryLabel = 'About Us',
  secondaryHref = '/en/about',
  imageSrc = '/images/homepage/home-hero-bg.png',
  imageAlt = 'Yanghua flexible busbar manufacturing',
  phone = '+86-769-3893-9888',
  phoneHref = 'tel:+86-769-3893-9888',
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-site grid-cols-1 items-center gap-8 px-4 py-section sm:px-6 lg:grid-cols-2 lg:gap-12">
        {/* Text Content */}
        <div className="order-2 space-y-5 lg:order-1 lg:space-y-6">
          {topper && (
            <Badge
              variant="secondary"
              className="bg-[hsl(var(--accent-shadcn))/0.15] px-4 py-1.5 text-topper font-bold uppercase tracking-widest text-[hsl(var(--accent-shadcn))] border-none"
            >
              {topper}
            </Badge>
          )}

          <h1
            className="font-heading text-display font-bold uppercase leading-none tracking-tight text-text"
            style={{ viewTransitionName: 'hero-heading' }}
          >
            {heading}
          </h1>

          <p className="max-w-lg text-lead leading-relaxed text-text-muted">
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
            <Button
              asChild
              size="lg"
              className="min-h-[44px] bg-[hsl(var(--accent-shadcn))] text-[hsl(var(--accent-shadcn-foreground))] font-bold hover:bg-[hsl(var(--accent-shadcn))]/90"
            >
              <a href={ctaHref}>
                {ctaLabel}
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[44px] border-2 border-primary font-bold text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <a href={secondaryHref}>{secondaryLabel}</a>
            </Button>
          </div>

          {/* Phone Contact */}
          <a
            href={phoneHref}
            className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-text-muted transition-colors hover:text-primary"
          >
            <Phone className="h-4 w-4" />
            Call {phone}
          </a>
        </div>

        {/* Hero Image */}
        <div
          className="relative order-1 overflow-hidden rounded-lg shadow-xl aspect-4/3 lg:order-2"
          style={{ viewTransitionName: 'hero-image' }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            width={800}
            height={600}
            loading="eager"
            className="size-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
