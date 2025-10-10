'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Calendar, Building2, TrendingUp } from 'lucide-react';

// 获取项目数据的函数
function getProjects(t: any) {
  return t.raw('list') as any[];
}

export default function ProjectsPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('projects');
  const projects = getProjects(t);
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#212529] mb-4">
            {t('page.title')}
          </h1>
          <p className="text-xl text-[#6c757d] max-w-3xl mx-auto">
            {t('page.description')}
          </p>
        </div>

        {/* Filter Options */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button className="btn-primary text-sm">{t('labels.allProjects')}</button>
          <button className="btn-secondary text-sm">{t('labels.dataCenter')}</button>
          <button className="btn-secondary text-sm">{t('labels.newEnergy')}</button>
          <button className="btn-secondary text-sm">{t('labels.industrial')}</button>
          <button className="btn-secondary text-sm">{t('labels.railTransit')}</button>
          <button className="btn-secondary text-sm">{t('labels.metallurgy')}</button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project: any) => (
            <div key={project.id} className="card overflow-hidden group">
              <div className="h-48 overflow-hidden bg-gray-200 flex items-center justify-center">
                <Image 
                  src={project.images?.[0] || '/images/no-image-available.webp'}
                  alt={project.title}
                  width={400}
                  height={200}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#212529] mb-2">
                  {project.title}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-[#6c757d]">
                    <span>{t('labels.client')}:</span>
                    <span className="font-medium">{project.client}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6c757d]">
                    <span>{t('labels.industry')}:</span>
                    <span className="font-medium">{project.industry}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6c757d]">
                    <span>{t('labels.scale')}:</span>
                    <span className="font-medium">{project.scale}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6c757d]">
                    <span>{t('labels.year')}:</span>
                    <span className="font-medium">{project.year}</span>
                  </div>
                </div>
                
                <p className="text-[#6c757d] mb-6">
                  {project.description}
                </p>
                
                <Link 
                  href={`/${params.locale}/projects/${project.id}`}
                  className="btn-primary w-full text-center"
                >
                  {t('labels.viewDetails')}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Project Statistics */}
        <div className="mt-16 bg-[#212529] rounded-lg p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#fdb827] mb-2">
                {t('stats.totalProjects')}
              </div>
              <div className="text-white">Total Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#fdb827] mb-2">
                {t('stats.industriesCovered')}
              </div>
              <div className="text-white">Industries Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#fdb827] mb-2">
                {t('stats.countriesServed')}
              </div>
              <div className="text-white">Countries Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#fdb827] mb-2">
                {t('stats.totalCapacity')}
              </div>
              <div className="text-white">Total Capacity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}