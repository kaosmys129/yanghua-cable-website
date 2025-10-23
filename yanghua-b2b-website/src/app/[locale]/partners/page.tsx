'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { Metadata } from 'next';
import type { Locale } from '@/lib/i18n';

export default function PartnersPage() {
  const t = useTranslations('partners');
  const locale = useLocale() as Locale;

  const partners = [
    { 
      name: 'BYD', 
      logo: '/images/partners/byd.webp',
      description: 'Leading electric vehicle and battery manufacturer'
    },
    { 
      name: 'CATL', 
      logo: '/images/partners/catl.webp',
      description: 'World\'s largest battery manufacturer'
    },
    { 
      name: 'Huawei', 
      logo: '/images/partners/huawei.webp',
      description: 'Global technology and telecommunications leader'
    },
    { 
      name: 'State Grid', 
      logo: '/images/partners/state grid.webp',
      description: 'China\'s largest electric utility company'
    },
    { 
      name: 'Power China', 
      logo: '/images/partners/powerchina.webp',
      description: 'Leading engineering and construction company'
    },
    { 
      name: 'China Southern Power Grid', 
      logo: '/images/partners/southern power grid.webp',
      description: 'Major power grid operator in southern China'
    },
    { 
      name: 'PetroChina', 
      logo: '/images/partners/oil china.webp',
      description: 'China\'s largest oil and gas producer'
    },
    { 
      name: 'Sinopec', 
      logo: '/images/partners/sinopec.webp',
      description: 'Leading petroleum and chemical company'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('title')}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Building strong partnerships with industry leaders worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {partners.map((partner, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 text-center border border-gray-100"
              >
                <div className="mb-6">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={120}
                    height={80}
                    className="mx-auto object-contain"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {partner.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {partner.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Partnership Benefits
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our strategic partnerships enable us to deliver exceptional value and innovation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600">
                Collaborative innovation drives technological advancement and product development
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Global Reach</h3>
              <p className="text-gray-600">
                Expanding market presence through strategic international partnerships
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality Assurance</h3>
              <p className="text-gray-600">
                Maintaining highest standards through trusted partner networks
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}