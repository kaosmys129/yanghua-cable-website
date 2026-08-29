import React from 'react';
import { Button } from '../ui/button';
import { Phone } from 'lucide-react';
import type { Locale } from '../../lib/yanghua/loaders';
import { route } from '../../lib/yanghua/routes';

interface CTASectionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  phone?: string;
  phoneHref?: string;
  locale?: Locale;
}

export default function CTASection({
  title = 'Ready to Get Started?',
  description = 'Contact us for product selection, technical support, and quotations.',
  buttonText = 'Get Quote',
  buttonHref,
  phone = '+86-769-3893-9888',
  phoneHref = 'tel:+86-769-3893-9888',
  locale = 'en',
}: CTASectionProps) {
  const resolvedButtonHref = buttonHref ?? route('contact', locale);

  return (
    <section className="relative overflow-hidden bg-primary py-16 sm:py-20 lg:py-24">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[hsl(var(--accent-shadcn))]" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[hsl(var(--accent-shadcn))]" />
      </div>

      <div className="relative mx-auto max-w-site px-4 text-center sm:px-6">
        <h2 className="font-heading text-h2 font-bold uppercase text-primary-foreground">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 leading-relaxed">
          {description}
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="min-h-[44px] bg-[hsl(var(--accent-shadcn))] font-bold text-[hsl(var(--accent-shadcn-foreground))] hover:bg-[hsl(var(--accent-shadcn))]/90"
          >
            <a href={resolvedButtonHref}>{buttonText}</a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-h-[44px] border-2 border-primary-foreground/30 font-bold text-primary-foreground hover:border-primary-foreground hover:bg-primary-foreground/10"
          >
            <a href={phoneHref}>
              <Phone className="mr-1.5 h-4 w-4" />
              Call {phone}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
