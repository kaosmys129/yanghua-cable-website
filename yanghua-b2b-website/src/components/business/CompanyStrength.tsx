'use client';

import { Award, Factory, Beaker, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Locale } from '@/lib/i18n';

type CompanyStrengthContent = {
  title: string;
  subtitle: string;
  ctaLearnMore: string;
  stats: {
    certifications: { value: string; label: string; description: string };
    capacity: { value: string; label: string; description: string };
    testing: { value: string; label: string; description: string };
    documentation: { value: string; label: string; description: string };
  };
};

export default function CompanyStrength({ content }: { content?: CompanyStrengthContent }) {
  const t = useTranslations('companyStrength');
  const locale = useLocale() as Locale;
  const statsContent = content?.stats;

  const stats = [
    {
      icon: Award,
      value: statsContent?.certifications.value ?? t('stats.certifications.value'),
      label: statsContent?.certifications.label ?? t('stats.certifications.label'),
      description: statsContent?.certifications.description ?? t('stats.certifications.description'),
    },
    {
      icon: Factory,
      value: statsContent?.capacity.value ?? t('stats.capacity.value'),
      label: statsContent?.capacity.label ?? t('stats.capacity.label'),
      description: statsContent?.capacity.description ?? t('stats.capacity.description'),
    },
    {
      icon: Beaker,
      value: statsContent?.testing.value ?? t('stats.testing.value'),
      label: statsContent?.testing.label ?? t('stats.testing.label'),
      description: statsContent?.testing.description ?? t('stats.testing.description'),
    },
    {
      icon: FileText,
      value: statsContent?.documentation.value ?? t('stats.documentation.value'),
      label: statsContent?.documentation.label ?? t('stats.documentation.label'),
      description: statsContent?.documentation.description ?? t('stats.documentation.description'),
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">
            {content?.title ?? t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {content?.subtitle ?? t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 bg-[#f8f9fa] rounded-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-[#fdb827] w-12 h-12 rounded-lg flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-[#212529]" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-[#212529]">
                  {item.value}
                </div>
                <div className="mt-1 text-sm font-medium text-gray-700 uppercase tracking-wide">
                  {item.label}
                </div>
                <p className="mt-3 text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link 
            href={buildLocalizedUrl('about', locale)} 
            className="inline-flex items-center text-[#fdb827] hover:text-[#e0a020] font-medium"
          >
            {content?.ctaLearnMore ?? t('ctaLearnMore')} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
