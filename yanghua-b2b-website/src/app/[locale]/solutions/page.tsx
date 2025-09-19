'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, CheckCircle, Download, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [selectedSolution, setSelectedSolution] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const t = useTranslations('solutions');
  
  const solutions = getSolutions(t);
  const solution = selectedSolution ? solutions.find((s: any) => s.id === selectedSolution) : null;
  
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

  if (solution) {
    return (
      <div className="min-h-screen bg-white">
        {/* Back Navigation */}
        <div className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => setSelectedSolution(null)}
              className="text-[#fdb827] hover:text-[#e0a020] font-medium flex items-center"
            >
              ← {t('navigation.backToSolutions')}
            </button>
          </div>
        </div>

        {/* Solution Detail */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h1 className="text-4xl font-bold text-[#212529] mb-4">{t(`${solution.id}.title`)}</h1>
              <p className="text-xl text-[#6c757d] mb-6">{t(`${solution.id}.subtitle`)}</p>
              <p className="text-[#6c757d] mb-8">{t(`${solution.id}.description`)}</p>
              
              <div className="space-y-3">
                {solution.highlights.map((highlight: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#fdb827] mr-3" />
                    <span className="text-[#6c757d]">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <img 
                src={solution.image} 
                alt={solution.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Applications */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#212529] mb-6">{t('common.keyApplications')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {solution.applications.map((app: string, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                  <span className="text-[#212529] font-medium">{app}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Advantages */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#212529] mb-6">{t('common.keyAdvantages')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {solution.advantages.map((advantage: any, index: number) => (
                <div key={index} className="card p-6">
                  <h3 className="text-lg font-semibold text-[#212529] mb-3">{advantage.title}</h3>
                  <p className="text-[#6c757d]">{advantage.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#212529] mb-6">{t('common.technicalSpecifications')}</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solution.technicalSpecs.map((spec: any, index: number) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <span className="font-medium text-[#212529]">{spec.parameter}</span>
                    <span className="text-[#6c757d]">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Case Studies */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#212529] mb-6">{t('common.caseStudies')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {solution.caseStudies.map((study: any, index: number) => (
                <div key={index} className="card p-6">
                  <h3 className="text-lg font-semibold text-[#212529] mb-2">{study.title}</h3>
                  <p className="text-[#6c757d]">{study.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-[#212529] text-white rounded-lg p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">{t('cta.solutionOverview')}</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span>Applications:</span>
                    <span className="text-gray-300">{solution.applications.length} key areas</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Industry:</span>
                    <span className="text-gray-300">{solution.title.split(' ')[0]}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Case Studies:</span>
                    <span className="text-gray-300">{solution.caseStudies.length} successful projects</span>
                  </li>
                </ul>
                
                <button className="w-full mt-6 bg-white text-[#212529] py-3 px-4 rounded-md font-medium hover:bg-gray-100 transition-colors duration-300 flex items-center justify-center">
                  <Download className="mr-2 h-4 w-4" />
                  {t('cta.downloadBrief')}
                </button>
                
                <button className="w-full mt-3 bg-[#fdb827] text-[#212529] py-3 px-4 rounded-md font-medium hover:bg-[#e0a020] transition-colors duration-300 flex items-center justify-center">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t('cta.requestConsultation')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div key={solution.id} className="card overflow-hidden group cursor-pointer" onClick={() => setSelectedSolution(solution.id)}>
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
            </div>
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