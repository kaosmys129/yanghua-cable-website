'use client';

import { Shield, Zap, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function ProductFeatures() {
  const t = useTranslations('productFeatures');
  const locale = useLocale();

  const features = [
    {
      icon: Shield,
      title: t('cards.safeReliable.title'),
      description: t('cards.safeReliable.description'),
      details: [
        t('cards.safeReliable.details.fireResistant'),
        t('cards.safeReliable.details.lowSmoke'),
        t('cards.safeReliable.details.halogenFree'),
      ],
    },
    {
      icon: Zap,
      title: t('cards.highEfficiency.title'),
      description: t('cards.highEfficiency.description'),
      details: [
        t('cards.highEfficiency.details.lowResistance'),
        t('cards.highEfficiency.details.minimalLoss'),
        t('cards.highEfficiency.details.highConductivity'),
      ],
    },
    {
      icon: TrendingUp,
      title: t('cards.superiorPerformance.title'),
      description: t('cards.superiorPerformance.description'),
      details: [
        t('cards.superiorPerformance.details.weatherResistant'),
        t('cards.superiorPerformance.details.uvProtection'),
        t('cards.superiorPerformance.details.extendedLifespan'),
      ],
    },
    {
      icon: DollarSign,
      title: t('cards.costEffective.title'),
      description: t('cards.costEffective.description'),
      details: [
        t('cards.costEffective.details.competitivePricing'),
        t('cards.costEffective.details.lowMaintenance'),
        t('cards.costEffective.details.highRoi'),
      ],
    },
  ];
  
  return (
    <section className="py-16 lg:py-24 bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Interest: Highlight key product benefits */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6 hover:shadow-xl transition-all duration-300 bg-white rounded-lg"
            >
              <div className="flex justify-center mb-6">
                {/* Icon per PRD: brand yellow 48px square, 8px radius, icon #212529 */}
                <div className="bg-[#fdb827] w-12 h-12 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-[#212529]" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-[#212529] mb-3 text-center">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 mb-4 text-center">
                {feature.description}
              </p>
              
              <ul className="space-y-1">
                {feature.details.map((detail) => (
                  <li key={detail} className="text-sm text-gray-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#fdb827] rounded-full mr-2"></div>
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href={`/${locale}/products`} 
            className="inline-flex items-center text-[#fdb827] hover:text-[#e0a020] font-medium"
          >
            {t('ctaExplore')} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}