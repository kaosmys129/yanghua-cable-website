import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  images?: string[];
}

interface ProjectGallerySectionProps {
  content?: {
    title?: string;
    subtitle?: string;
    viewDetails?: string;
    viewAllProjects?: string;
  };
  projects?: Project[];
  locale?: string;
}

export default function ProjectGallerySection({
  content = {},
  projects = [],
  locale = 'en',
}: ProjectGallerySectionProps) {
  const {
    title = 'Featured Projects',
    subtitle = 'Explore our recent work across industries',
    viewDetails = 'View Details',
    viewAllProjects = 'View All Projects',
  } = content;

  const basePath = locale === 'es' ? '/es/proyectos' : '/en/projects';

  return (
    <section className="py-section">
      <div className="mx-auto max-w-site px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="text-topper font-bold uppercase tracking-widest text-[hsl(var(--accent-shadcn))]">
            Yanghua
          </span>
          <h2 className="mt-2 font-heading text-h2 font-bold uppercase text-text">
            {title}
          </h2>
          <p className="mt-3 text-text-muted leading-relaxed">{subtitle}</p>
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {projects.slice(0, 4).map((project) => (
            <a
              key={project.id}
              href={`${basePath}/${project.id}`}
              className="group"
            >
              <Card className="overflow-hidden border-border bg-surface shadow-sm transition hover:shadow-md">
                <div className="h-44 overflow-hidden bg-background">
                  <img
                    src={project.images?.[0] || '/images/no-image-available.webp'}
                    alt={project.title}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-text">
                    {project.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-text-muted">
                    {project.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--accent-shadcn))]">
                    {viewDetails}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            </a>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg" className="min-h-[44px] border-2 border-primary font-bold text-primary hover:bg-primary hover:text-primary-foreground">
            <a href={basePath}>{viewAllProjects}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
