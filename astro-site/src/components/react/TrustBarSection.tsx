import React from 'react';
import { Badge } from '../ui/badge';
import { ShieldCheck } from 'lucide-react';

interface TrustItem {
  label: string;
  value?: string;
}

interface TrustBarSectionProps {
  items?: TrustItem[];
}

export default function TrustBarSection({
  items = [
    { label: 'Licensed' },
    { label: 'Fully Insured' },
    { label: 'Years Experience', value: '15+' },
    { label: 'Jobs Completed', value: '2,500+' },
  ],
}: TrustBarSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface" aria-label="Trust signals">
      <div className="mx-auto max-w-site overflow-x-auto px-4 py-5 sm:px-6 sm:py-6">
        <ul
          className="flex flex-wrap items-center justify-between gap-6 sm:gap-8 lg:justify-center lg:gap-16"
          role="list"
        >
          {items.map(({ label, value }) => (
            <li key={label} className="flex shrink-0 items-center gap-2.5 text-sm sm:text-base">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[hsl(var(--accent-shadcn))]" />
              <span className="font-heading font-semibold text-text">
                {value && (
                  <span className="text-primary">{value}{' '}</span>
                )}
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
