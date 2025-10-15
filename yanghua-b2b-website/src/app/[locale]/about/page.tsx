"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/business/VideoPlayer';
import TestingEquipmentSlider from '@/components/business/TestingEquipmentSlider';
import DownloadButton from '@/components/ui/DownloadButton';
import StructuredDataScript from '@/components/seo/StructuredDataScript';
import { generateAboutPageSchema, generateOrganizationSchema } from '@/lib/structured-data';

export default function AboutPage() {
  const t = useTranslations('about');
  const params = useParams();
  const locale = params.locale as string;
  
  // 生成结构化数据
  const aboutPageSchema = generateAboutPageSchema();
  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      <StructuredDataScript schema={aboutPageSchema} />
      <StructuredDataScript schema={organizationSchema} />
      <div className="min-h-screen bg-white">
        {/* 现有的关于页面内容 */}
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8">{t('title')}</h1>
          
          {/* 公司介绍视频 */}
          <div className="mb-12">
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
            />
          </div>
          
          {/* 公司历程 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">{t('history.title')}</h2>
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed">
                {t('history.description')}
              </p>
            </div>
          </section>
          
          {/* 使命愿景 */}
          <section className="mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">{t('mission.title')}</h3>
                <p className="text-gray-700">{t('mission.description')}</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">{t('vision.title')}</h3>
                <p className="text-gray-700">{t('vision.description')}</p>
              </div>
            </div>
          </section>
          
          {/* 测试设备展示 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">{t('equipment.title')}</h2>
            <TestingEquipmentSlider />
          </section>
          
          {/* 资质认证 */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">{t('certifications.title')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* 认证证书展示 */}
              <div className="text-center">
                <div className="bg-gray-100 h-48 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500">ISO 9001</span>
                </div>
                <h4 className="font-semibold">ISO 9001:2015</h4>
                <p className="text-sm text-gray-600">{t('certifications.iso9001')}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-100 h-48 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500">CE</span>
                </div>
                <h4 className="font-semibold">CE Certification</h4>
                <p className="text-sm text-gray-600">{t('certifications.ce')}</p>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-100 h-48 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500">UL</span>
                </div>
                <h4 className="font-semibold">UL Listed</h4>
                <p className="text-sm text-gray-600">{t('certifications.ul')}</p>
              </div>
            </div>
          </section>
          
          {/* 下载中心 */}
          <section className="text-center">
            <h2 className="text-3xl font-bold mb-6">{t('downloads.title')}</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <DownloadButton 
                resourceId="company-brochure"
                locale={locale}
              >
                {t('downloads.brochure')}
              </DownloadButton>
              <DownloadButton 
                resourceId="certifications"
                locale={locale}
              >
                {t('downloads.certifications')}
              </DownloadButton>
              <DownloadButton 
                resourceId="quality-manual"
                locale={locale}
              >
                {t('downloads.qualityManual')}
              </DownloadButton>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}