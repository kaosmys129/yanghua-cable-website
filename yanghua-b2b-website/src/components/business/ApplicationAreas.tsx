'use client';

import { Zap, Building, Factory, Database, Train, FlaskConical, Ship, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useMemo } from 'react';

export default function ApplicationAreas() {
  const t = useTranslations('applicationAreas');
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;

  const areas = [
    {
      icon: Zap,
      title: t('areas.energy.title'),
      description: t('areas.energy.description'),
      href: `/${locale}/solutions/energy`,
    },
    {
      icon: Building,
      title: t('areas.building.title'),
      description: t('areas.building.description'),
      href: `/${locale}/solutions/building`,
    },
    {
      icon: Factory,
      title: t('areas.industry.title'),
      description: t('areas.industry.description'),
      href: `/${locale}/solutions/industry`,
    },
    {
      icon: Database,
      title: t('areas.dataCenter.title'),
      description: t('areas.dataCenter.description'),
      href: `/${locale}/solutions/data-center`,
    },
    {
      icon: Train,
      title: t('areas.railway.title'),
      description: t('areas.railway.description'),
      href: `/${locale}/solutions/railway`,
    },
    {
      icon: FlaskConical,
      title: t('areas.chemical.title'),
      description: t('areas.chemical.description'),
      href: `/${locale}/solutions/chemical`,
    },
    {
      icon: Ship,
      title: t('areas.marine.title'),
      description: t('areas.marine.description'),
      href: `/${locale}/solutions/marine`,
    },
  ];

  const totalPages = Math.ceil(areas.length / itemsPerPage);
  const currentAreas = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return areas.slice(startIndex, startIndex + itemsPerPage);
  }, [areas, currentPage, itemsPerPage]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handlePageClick = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">{t('title')}</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[600px]">
          {currentAreas.map((area, idx) => (
            <motion.div
              key={`${area.title}-${currentPage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="p-6 rounded-lg bg-[#f8f9fa] hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-[#fdb827] w-12 h-12 rounded-lg flex items-center justify-center">
                  <area.icon className="h-6 w-6 text-[#212529]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#212529] text-center mb-2">{area.title}</h3>
              <p className="text-gray-600 text-center mb-6">{area.description}</p>
              <div className="text-center">
                <Link href={area.href} className="inline-flex items-center text-[#fdb827] hover:text-[#e0a020] font-medium">
                  {t('ctaViewSolution')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 space-x-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('pagination.previous')}
            </button>
            
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageClick(index)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === index
                      ? 'bg-[#fdb827] text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('pagination.next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}