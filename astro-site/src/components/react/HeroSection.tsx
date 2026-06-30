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
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Full-screen background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={imageSrc}
          alt={imageAlt}
          loading="eager"
          className="size-full object-cover"
          style={{ viewTransitionName: 'hero-image' }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 mx-auto w-full max-w-site px-4 py-section sm:px-6">
        <div className="max-w-xl space-y-5 lg:space-y-6">
          {topper && (
            <Badge
              variant="secondary"
              className="bg-[hsl(var(--accent-shadcn))/0.85] px-4 py-1.5 text-topper font-bold uppercase tracking-widest text-[hsl(var(--accent-shadcn))] border-none"
            >
              {topper}
            </Badge>
          )}

          <h1
            className="font-heading text-display font-bold uppercase leading-none tracking-tight text-white"
            style={{ viewTransitionName: 'hero-heading' }}
          >
            {heading}
          </h1>

          <p className="max-w-lg text-lead leading-relaxed text-white/80">
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
              className="min-h-[44px] border-2 border-white/60 font-bold text-white hover:bg-white hover:text-black"
            >
              <a href={secondaryHref}>{secondaryLabel}</a>
            </Button>
          </div>

          {/* Phone Contact */}
          <a
            href={phoneHref}
            className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-white/70 transition-colors hover:text-white"
          >
            <Phone className="h-4 w-4" />
            Call {phone}
          </a>
        </div>
      </div>
    </section>
  );
}
