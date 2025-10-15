'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';

// Get solutions data from translations
function getSolutions(t: any) {
  try {
    const solutionsData = t.raw('solutions');
    return Array.isArray(solutionsData) ? solutionsData : [];
  } catch (error) {
    console.error('Error loading solutions data:', error);
    return [];
  }
}

export default function SolutionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const t = useTranslations('solutions');
  const params = useParams() as Record<string, string | undefined>;
  const locale = (params?.locale ?? 'en') as string;
  
  const solutions = getSolutions(t);
  
  // Handle empty solutions gracefully
  if (!solutions || solutions.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-[#212529] mb-4">
              {t('page.title')}
            </h1>
            <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
              {t('page.description')}
            </p>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('common.noSolutionsAvailable', { defaultValue: 'No solutions available at the moment' })}
            </h2>
            <p className="text-gray-600">
              {t('common.solutionsLoadingError', { defaultValue: 'We are experiencing technical difficulties. Please try again later.' })}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Pagination logic - only execute if we have solutions
  const itemsPerPage = 6;
  const totalPages = Math.ceil(solutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSolutions = solutions.slice(startIndex, endIndex);
  
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#212529] mb-4">
            {t('page.title')}
          </h1>
          <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
            {t('page.description')}
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentSolutions.map((solution: any) => (
            <Link key={solution.id} href={`/${locale}/solutions/${solution.id}`} className="card overflow-hidden group cursor-pointer">
              <div className="h-48 overflow-hidden">
                <img 
                  src={solution.image} 
                  alt={solution.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#212529] mb-2">
                  {solution.title}
                </h3>
                
                <p className="text-[#6c757d] mb-4">
                  {solution.subtitle}
                </p>
                
                <div className="space-y-2 mb-6">
                  {solution.highlights.slice(0, 2).map((highlight: string, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-[#fdb827] mr-2" />
                      <span className="text-[#6c757d]">{highlight}</span>
                    </div>
                  ))}
                </div>
                
                <button className="btn-primary w-full group-hover:bg-[#e0a020] transition-colors duration-300 flex items-center justify-center">
                  {t('common.viewDetails')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-12 space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    currentPage === page
                      ? 'text-white bg-[#fdb827] border border-[#fdb827]'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
        
        {/* Page Info */}
        {totalPages > 1 && (
          <div className="text-center mt-4 text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, solutions.length)} of {solutions.length} solutions
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-[#212529] mb-4">
            {t('cta.customSolution.title')}
          </h2>
          <p className="text-[#6c757d] mb-8 max-w-2xl mx-auto">
            {t('cta.customSolution.description')}
          </p>
          <Link href="/contact" className="btn-primary inline-flex items-center">
            {t('common.contactUs')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}