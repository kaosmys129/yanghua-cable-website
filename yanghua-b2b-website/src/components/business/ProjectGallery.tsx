'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { buildLocalizedUrl } from '@/lib/url-localization';
import type { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  title: string;
  client: string;
  industry: string;
  location: string;
  duration: string;
  completionDate: string;
  projectScale: string;
  scale: string;
  year: string;
  description: string;
}

interface ProjectGalleryProps {
  projects: Project[];
  onQuoteOpen?: () => void;
  content?: {
    title?: string;
    subtitle?: string;
    viewDetails?: string;
    viewAllProjects?: string;
  };
}

export default function ProjectGallery({ projects, onQuoteOpen, content }: ProjectGalleryProps) {
  const t = useTranslations('projectGallery');
  const locale = useLocale() as Locale;

  const featuredProjects = projects.slice(0, 4);

  const getImageSrc = (project: Project) => {
    if (!project.title) {
      return '/images/no-image-available.webp';
    }
    const imageName = project.title.toLowerCase().replace(/\s+/g, '-') + '.webp';
    return `/images/projects-home/${imageName}`;
  };

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-3 py-1 text-sm border-[#fdb827] text-[#fdb827]">
            Featured Projects
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">
            {content?.title ?? t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {content?.subtitle ?? t('subtitle')}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5">
          {featuredProjects.map((project, index) => (
            <div
              key={project.id}
              className="group relative h-96 overflow-hidden cursor-pointer"
            >
              {/* Background Image */}
              <Image
                src={getImageSrc(project)}
                alt={project.title}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                style={{ filter: 'brightness(70%)' }}
                placeholder="blur"
                blurDataURL="/images/no-image-available.webp"
              />

              {/* Gradient Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                {/* Industry Badge */}
                {project.industry && (
                  <Badge
                    variant="outline"
                    className="self-start mb-3 text-xs border-white/40 text-white/90 bg-white/10 backdrop-blur-sm"
                  >
                    {project.industry}
                  </Badge>
                )}

                <h3 className="text-xl font-bold mb-2 group-hover:text-[#fdb827] transition-colors duration-300">
                  {project.title}
                </h3>

                <p className="text-gray-200 text-sm mb-4 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                  {project.description}
                </p>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="self-start text-white hover:text-[#fdb827] hover:bg-white/10 border border-white/30 hover:border-[#fdb827] transition-all duration-300"
                >
                  <Link
                    href={`/${locale}/projects/${project.id}`}
                    onClick={(e) => {
                      if (onQuoteOpen) {
                        e.preventDefault();
                        onQuoteOpen();
                      }
                    }}
                  >
                    {content?.viewDetails ?? t('viewDetails')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-16 text-center">
          <Button
            variant="brand"
            size="lg"
            asChild
            className="shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <Link
              href={buildLocalizedUrl('projects', locale)}
              onClick={(e) => {
                if (onQuoteOpen) {
                  e.preventDefault();
                  onQuoteOpen();
                }
              }}
            >
              {content?.viewAllProjects ?? t('viewAllProjects')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
