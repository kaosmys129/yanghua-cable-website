'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';

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
}

export default function ProjectGallery({ projects }: ProjectGalleryProps) {
  const t = useTranslations('projectGallery');
  const locale = useLocale();

  // Get first 4 projects
  const featuredProjects = projects.slice(0, 4);

  // Get image source dynamically from project title
  const getImageSrc = (project: Project) => {
    if (!project.title) {
      return '/images/no-image-available.webp';
    }
    // Generate image name from title (e.g., "My Project Title" -> "my-project-title.webp")
    const imageName = project.title.toLowerCase().replace(/\s+/g, '-') + '.webp';
    return `/images/projects-home/${imageName}`;
  };

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#212529] mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {featuredProjects.map((project, index) => (
            <div 
              key={project.id} 
              className="group relative h-96 overflow-hidden"
            >
              {/* Background Image */}
              <Image 
                src={getImageSrc(project)}
                alt={project.title}
                fill
                priority={index===0}
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500" style={{ filter: 'brightness(70%)' }}
                placeholder="blur"
                blurDataURL="/images/no-image-available.webp"
              />
              
              {/* Overlay (transparent by default) */}
              {/* <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-30 transition-all duration-300" /> */}
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                <h3 className="text-xl font-bold mb-2 group-hover:text-[#fdb827] transition-colors duration-300">
                  {project.title}
                </h3>
                
                <p className="text-gray-200 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
                
                <Link 
                  href={`/${locale}/projects/${project.id}`}
                  className="inline-flex items-center bg-transparent text-white hover:bg-white hover:text-black px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 w-fit"
                >
                  {t('viewDetails')} 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Projects CTA */}
        <div className="mt-12 text-center">
          <Link 
            href={`/${locale}/projects`} 
            className="inline-flex items-center bg-[#fdb827] hover:bg-[#e0a020] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {t('viewAllProjects')} 
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// CSS for line-clamp (add to globals.css if not already present)
// .line-clamp-2 {
//   display: -webkit-box;
//   -webkit-line-clamp: 2;
//   -webkit-box-orient: vertical;
//   overflow: hidden;
// }
// 
// .line-clamp-3 {
//   display: -webkit-box;
//   -webkit-line-clamp: 3;
//   -webkit-box-orient: vertical;
//   overflow: hidden;
// }