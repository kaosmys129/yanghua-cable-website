'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/lib/i18n';

interface CaseItem {
  id: string;
  title: string;
  client?: string;
  industry?: string;
  location?: string;
  params?: { label: string; value: string }[];
  testimonial?: string;
}

interface CasesWithDetailsProps {
  cases: CaseItem[];
}

export default function CasesWithDetails({ cases }: CasesWithDetailsProps) {
  const t = useTranslations('caseDetails');
  const locale = useLocale() as Locale;

  const getImageSrc = (title: string) => {
    if (!title) return '/images/no-image-available.webp';
    const name = title.toLowerCase().replace(/\s+/g, '-') + '.webp';
    return `/images/projects-home/${name}`;
  };

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">
            {t('title') || (locale === 'es' ? 'Casos de Ingeniería' : 'Engineering Case Studies')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('subtitle') || (locale === 'es' ? 'Proyectos con parámetros clave y testimonios reales' : 'Projects with key parameters and real testimonials')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map((c) => (
            <article key={c.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="relative h-48 w-full">
                <Image
                  src={getImageSrc(c.title)}
                  alt={c.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#212529] mb-2">{c.title}</h3>
                <div className="text-sm text-[#6c757d] mb-3">
                  {(c.client || c.industry || c.location) && (
                    <div>
                      {c.client && <span className="mr-2">{locale === 'es' ? 'Cliente' : 'Client'}: {c.client}</span>}
                      {c.industry && <span className="mr-2">{locale === 'es' ? 'Industria' : 'Industry'}: {c.industry}</span>}
                      {c.location && <span>{locale === 'es' ? 'Ubicación' : 'Location'}: {c.location}</span>}
                    </div>
                  )}
                </div>

                {/* Key Parameters */}
                {c.params && c.params.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-[#212529] mb-2">{locale === 'es' ? 'Parámetros Clave' : 'Key Parameters'}</h4>
                    <ul className="list-disc pl-5 text-sm text-[#6c757d] space-y-1">
                      {c.params.map((p, idx) => (
                        <li key={idx}><span className="font-medium text-[#212529]">{p.label}:</span> {p.value}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Testimonial */}
                {c.testimonial && (
                  <blockquote className="border-l-4 border-[#fdb827] pl-4 italic text-gray-700 text-sm">
                    “{c.testimonial}”
                  </blockquote>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}