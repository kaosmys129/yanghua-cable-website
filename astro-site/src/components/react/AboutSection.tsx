import React from 'react';
import { Button } from '../ui/button';
import { ArrowRight, Check } from 'lucide-react';

interface AboutSectionProps {
  topper?: string;
  heading?: string;
  body?: string[];
  benefits?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  imageSrc?: string;
  mobileImageSrc?: string;
  imageAlt?: string;
}

export default function AboutSection({
  topper = 'Who We Are',
  heading = 'Trusted by homeowners for over 15 years',
  body = [
    'We\'re a locally owned and operated business dedicated to delivering honest, dependable service.',
    'From day one, we\'ve built our reputation on doing the work right and treating every home like our own.',
  ],
  benefits = [
    'Background-checked, licensed professionals',
    'Upfront pricing with no hidden fees',
    'Satisfaction guaranteed on every project',
  ],
  ctaLabel = 'More About Us',
  ctaHref = '/about',
  imageSrc = '/images/about/img-strength.webp',
  mobileImageSrc = '/images/about/img-strength-mobile.webp',
  imageAlt = 'Yanghua professional team',
}: AboutSectionProps) {
  return (
    <section className="py-section">
      <div className="mx-auto grid max-w-site grid-cols-1 items-stretch gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
        {/* Image */}
        <div className="overflow-hidden rounded-lg shadow-lg">
          <picture>
            <source media="(max-width: 1023px)" srcSet={mobileImageSrc} />
            <img
              src={imageSrc}
              alt={imageAlt}
              width={1600}
              height={640}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </picture>
        </div>

        {/* Content */}
        <div className="space-y-5">
          <span className="text-topper font-bold uppercase tracking-widest text-[hsl(var(--accent-shadcn))]">
            {topper}
          </span>
          <h2 className="font-heading text-h2 font-bold uppercase text-text">
            {heading}
          </h2>

          {body.map((paragraph, i) => (
            <p key={i} className="text-text-muted leading-relaxed">
              {paragraph}
            </p>
          ))}

          {/* Benefits List */}
          <ul className="space-y-3 pt-2" role="list">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--accent-shadcn))]" />
                <span className="text-text">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2">
            <Button asChild size="lg" className="min-h-[44px] bg-primary font-bold text-primary-foreground">
              <a href={ctaHref}>
                {ctaLabel}
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
