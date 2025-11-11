'use client';

import LightboxImage from '@/components/LightboxImage';
import { useTranslations } from 'next-intl';

interface CertificationsGalleryProps {
  locale: 'en' | 'es';
  count?: number; // default 6
}

export default function CertificationsGallery({ locale, count = 6 }: CertificationsGalleryProps) {
  const t = useTranslations('certifications');
  const items = Array.from({ length: count }).map((_, idx) => ({
    src: `/images/certifications/cert${idx + 1}.webp`,
    alt: `${locale === 'es' ? 'Certificación' : 'Certification'} ${idx + 1}`,
  }));

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-2">
            {t('title') || (locale === 'es' ? 'Certificaciones' : 'Certifications')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('subtitle') || (locale === 'es' ? 'Calidad y cumplimiento' : 'Quality and compliance')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm p-4">
              <LightboxImage src={item.src} alt={item.alt} />
              <div className="mt-3 text-center text-sm text-gray-700">{item.alt}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}