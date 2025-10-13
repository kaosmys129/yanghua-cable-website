"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/business/VideoPlayer';
import TestingEquipmentSlider from '@/components/business/TestingEquipmentSlider';
import DownloadButton from '@/components/ui/DownloadButton';

export default function AboutPage() {
  const t = useTranslations('about');
  const params = useParams();
  const locale = params.locale as string;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Company milestones data
  const getMilestones = () => {
    try {
      const data = t.raw('timeline.milestones');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error loading milestones:', error);
      return [];
    }
  };

  // Company stats data
  const getCompanyStats = () => [
    { number: "40+", label: "Patents" },
    { number: "2", label: "Production Lines" },
    { number: "3", label: "Laboratories" },
    { number: "11", label: "Enterprise Standards" },
  ];

  const milestones = getMilestones() as Array<{year: string, event: string}>;
  const companyStats = getCompanyStats();

  // Handle empty milestones gracefully - return early if no data
  if (!milestones || milestones.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section - Attention */}
        <div className="relative bg-gradient-to-r from-[#212529] to-[#343a40] text-white overflow-hidden">
          {/* Background Image with Overlay for Dimming Effect */}
          <div className="absolute inset-0 opacity-30">
            <img 
              src="/images/about/img-strength.jpg" 
              alt="Yanghua Manufacturing Facility" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-gray-200">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-[#fdb827] hover:bg-[#e6a51e] text-[#212529] font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105">
                  {t('hero.cta.explore')}
                </button>
                <button className="bg-transparent border-2 border-white hover:bg-white hover:text-[#212529] text-white font-semibold py-3 px-8 rounded-lg transition duration-300">
                  {t('hero.cta.download')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('common.timelineLoadingError', { defaultValue: 'Timeline data is currently unavailable' })}
            </h2>
            <p className="text-gray-600">
              {t('common.timelineLoadingDescription', { defaultValue: 'We are experiencing technical difficulties loading our company timeline. Please try again later.' })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Attention */}
      <div className="relative bg-gradient-to-r from-[#212529] to-[#343a40] text-white overflow-hidden">
        {/* Background Image with Overlay for Dimming Effect */}
        <div className="absolute inset-0 opacity-30">
          <img 
            src="/images/about/img-strength.jpg" 
            alt="Yanghua Manufacturing Facility" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-gray-200">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-[#fdb827] hover:bg-[#e6a51e] text-[#212529] font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105">
                {t('hero.cta.explore')}
              </button>
              <DownloadButton 
                resourceId="company-profile"
                locale={locale}
                variant="secondary"
                className="bg-transparent border-2 border-white hover:bg-white hover:text-[#212529] text-white"
              >
                {t('hero.cta.download')}
              </DownloadButton>
            </div>
          </div>
        </div>
      </div>

      {/* Company Overview - Interest */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-6">
              {t('overview.title')}
            </h2>
            <p className="text-lg text-[#6c757d] mb-6">
              {t('overview.description')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {companyStats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-[#f8f9fa] rounded-lg">
                  <div className="text-2xl md:text-3xl font-bold text-[#fdb827] mb-1">{stat.number}</div>
                  <div className="text-sm md:text-base text-[#6c757d]">{t(`overview.stats.${stat.label.toLowerCase().replace(' ', '')}`)}</div>
                </div>
              ))}
            </div>
          </div>
          <VideoPlayer
            videoSources={{
              en: [
                { src: '/videos/company-intro-en.mp4', type: 'video/mp4' },
                { src: '/videos/company-intro-en.webm', type: 'video/webm' },
              ],
              es: [
                { src: '/videos/company-intro-es.mp4', type: 'video/mp4' },
                { src: '/videos/company-intro-es.webm', type: 'video/webm' },
              ],
            }}
            thumbnailUrl="/images/company-intro.webp"
            title={t('video.companyIntro')}
            className="shadow-lg"
          />
        </div>
      </div>

      {/* Our Mission & Values - Interest */}
      <div className="bg-[#f8f9fa] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">{t('mission.title')}</h2>
            <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
              {t('mission.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-[#212529] mb-4">{t('mission.missionTitle')}</h3>
              <p className="text-lg text-[#6c757d] mb-6">
                {t('mission.missionContent')}
              </p>
              <p className="text-[#6c757d]">
                {t('mission.missionDescription')}
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-[#212529] mb-4">{t('mission.valuesTitle')}</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-3 h-3 bg-[#fdb827] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-[#6c757d]">{t('mission.values.innovation')}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 bg-[#fdb827] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-[#6c757d]">{t('mission.values.responsibility')}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 bg-[#fdb827] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-[#6c757d]">{t('mission.values.cooperation')}</span>
                </li>
                <li className="flex items-start">
                  <div className="w-3 h-3 bg-[#fdb827] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-[#6c757d]">{t('mission.values.sustainability')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Development Timeline - Desire */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">{t('timeline.title')}</h2>
          <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
            {t('timeline.subtitle')}
          </p>
        </div>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-[#fdb827] hidden md:block"></div>
          
          <div className="space-y-12">
            {milestones.map((milestone: {year: string, event: string}, index: number) => (
              <div key={index} className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                <div className="md:w-1/2 mb-4 md:mb-0 md:px-8 md:pr-12 md:text-right">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-[#212529] mb-2">{milestone.year}</h3>
                    <p className="text-[#6c757d]">{milestone.event}</p>
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white font-bold border-4 border-white shadow-md">
                    {index + 1}
                  </div>
                </div>
                <div className="md:w-1/2 md:px-8 md:pl-12 hidden md:block"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testing Equipment Showcase */}
      <TestingEquipmentSlider />

      {/* Certifications - Desire */}
      <div className="bg-[#212529] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('certifications.title')}</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('certifications.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12 justify-items-center">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#343a40] p-4 rounded-lg shadow-lg w-full max-w-[200px] h-auto flex items-center justify-center">
                <img src={`/images/certifications/cert${i}.webp`} alt={`Certification ${i}`} className="w-full h-auto object-contain" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
            {[7, 8, 9, 10, 11].map((i) => (
              <div key={i} className="bg-[#343a40] p-4 rounded-lg shadow-lg w-full max-w-[200px] h-auto flex items-center justify-center">
                <img src={`/images/certifications/cert${i}.webp`} alt={`Certification ${i}`} className="w-full h-auto object-contain" />
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
              {t('certifications.description')}
            </p>
            <button className="bg-[#fdb827] hover:bg-[#e6a51e] text-[#212529] font-semibold py-3 px-8 rounded-lg transition duration-300">
              {t('certifications.cta')}
            </button>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">{t('team.title')}</h2>
            <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
              {t('team.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team member 1 */}
            <div className="text-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-4 flex items-center justify-center text-gray-500">
                <img src={`/images/about/Du.jpg`} alt="Dr Du Jingbiao" className="w-full h-auto object-contain" />
              </div>
              <h3 className="text-xl font-bold text-[#212529] mb-1">Dr Du Jingbiao</h3>
              <p className="text-[#fdb827] mb-2">{t('team.positions.ceo')}</p>
              <p className="text-[#6c757d] text-sm">
                {t('team.experience.ceo')}
              </p>
            </div>
            
            {/* Team member 2 */}
            <div className="text-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-4 flex items-center justify-center text-gray-500">
                    <img src={`/images/about/Hu.jpg`} alt="Mr Hu Runyi" className="w-full h-auto object-contain" />

              </div>
              <h3 className="text-xl font-bold text-[#212529] mb-1">Mr Hu Runyi</h3>
              <p className="text-[#fdb827] mb-2">{t('team.positions.cto')}</p>
              <p className="text-[#6c757d] text-sm">
                {t('team.experience.cto')}
              </p>
            </div>
            
            {/* Team member 3 */}
            <div className="text-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-4 flex items-center justify-center text-gray-500">
                  <img src={`/images/about/Li.jpg`} alt="Mr Li Xiaohua" className="w-full h-auto object-contain" />

              </div>
              <h3 className="text-xl font-bold text-[#212529] mb-1">Mr Li Xiaohua</h3>
              <p className="text-[#fdb827] mb-2">{t('team.positions.engineer')}</p>
              <p className="text-[#6c757d] text-sm">
                {t('team.experience.engineer')}
              </p>
            </div>
            
              {/* Team member 4 */}
            <div className="text-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-4 flex items-center justify-center text-gray-500">
                  <img src={`/images/about/peng.webp`} alt="Mr Peng" className="w-full h-auto object-contain" />

              </div>
              <h3 className="text-xl font-bold text-[#212529] mb-1">Mr Peng Qian</h3>
              <p className="text-[#fdb827] mb-2">{t('team.positions.qa')}</p>
              <p className="text-[#6c757d] text-sm">
                {t('team.experience.qa')}
              </p>
            </div>
          
          </div>
        </div>
      </div>

      {/* CTA Section - Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="bg-gradient-to-r from-[#212529] to-[#343a40] rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-[#fdb827] hover:bg-[#e6a51e] text-[#212529] font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105">
              {t('cta.buttons.contact')}
            </button>
            <button className="bg-transparent border-2 border-white hover:bg-white hover:text-[#212529] text-white font-semibold py-3 px-8 rounded-lg transition duration-300">
              {t('cta.buttons.quote')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}