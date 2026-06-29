'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, Calendar, Building2, TrendingUp, ArrowRight, Building, Clock, Zap, Filter, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
  images?: string[];
}

interface ProjectsPageClientProps {
  projects: Project[];
  stats: {
    totalProjects: string;
    industriesCovered: string;
    countriesServed: string;
    totalCapacity: string;
  };
}

const ALL_CATEGORIES_KEY = 'all';

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; borderColor: string; activeClass: string }> = {
  [ALL_CATEGORIES_KEY]: {
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-amber-500 text-white',
    borderColor: 'border-amber-500',
    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20',
  },
  'Data Center': {
    icon: <Building className="h-4 w-4" />,
    color: 'bg-blue-500 text-white',
    borderColor: 'border-blue-500',
    activeClass: 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20',
  },
  'New Energy': {
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-emerald-500 text-white',
    borderColor: 'border-emerald-500',
    activeClass: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20',
  },
  'Industrial': {
    icon: <Building2 className="h-4 w-4" />,
    color: 'bg-slate-600 text-white',
    borderColor: 'border-slate-600',
    activeClass: 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20',
  },
  'Rail Transit': {
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'bg-purple-500 text-white',
    borderColor: 'border-purple-500',
    activeClass: 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20',
  },
  'Metallurgy': {
    icon: <Building2 className="h-4 w-4" />,
    color: 'bg-orange-500 text-white',
    borderColor: 'border-orange-500',
    activeClass: 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20',
  },
};

export default function ProjectsPageClient({ projects, stats }: ProjectsPageClientProps) {
  const t = useTranslations('projects');
  const locale = useLocale();

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES_KEY);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique industries from projects
  const categories = useMemo(() => {
    const industries = Array.from(new Set(projects.map((p) => p.industry)));
    return [ALL_CATEGORIES_KEY, ...industries];
  }, [projects]);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        activeCategory === ALL_CATEGORIES_KEY || project.industry === activeCategory;
      const matchesSearch =
        !searchQuery ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [projects, activeCategory, searchQuery]);

  const hasActiveFilters = activeCategory !== ALL_CATEGORIES_KEY || searchQuery;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-3 py-1 text-sm border-[#fdb827] text-[#fdb827]">
            {locale === 'es' ? 'Nuestros Proyectos' : 'Our Projects'}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-[#212529] mb-4 tracking-tight">
            {t('page.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('page.description')}
          </p>
        </div>

        <Separator className="mb-10" />

        {/* Search and Filter Bar */}
        <div className="mb-10 space-y-6">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={
                locale === 'es'
                  ? 'Buscar proyectos...'
                  : 'Search projects by name, client, or industry...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-2 focus-visible:border-[#fdb827] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {categories.map((category) => {
              const config = CATEGORY_CONFIG[category] || {
                icon: <Filter className="h-4 w-4" />,
                color: 'bg-gray-500 text-white',
                borderColor: 'border-gray-500',
                activeClass: 'bg-gray-500 text-white border-gray-500 shadow-md',
              };
              const isActive = activeCategory === category;

              return (
                <Button
                  key={category}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className={`
                    rounded-full px-4 py-2 text-sm font-medium transition-all duration-300
                    ${
                      isActive
                        ? config.activeClass
                        : `border-2 text-muted-foreground hover:text-foreground hover:border-foreground/30`
                    }
                  `}
                >
                  <span className="mr-1.5">{config.icon}</span>
                  {category === ALL_CATEGORIES_KEY
                    ? locale === 'es'
                      ? 'Todos'
                      : 'All Projects'
                    : category}
                </Button>
              );
            })}
          </div>

          {/* Active filter indicator & results count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveCategory(ALL_CATEGORIES_KEY);
                    setSearchQuery('');
                  }}
                  className="h-8 text-xs gap-1"
                >
                  <X className="h-3 w-3" />
                  {locale === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                </Button>
              )}
            </div>
            <span>
              {filteredProjects.length}{' '}
              {locale === 'es'
                ? filteredProjects.length === 1
                  ? 'proyecto encontrado'
                  : 'proyectos encontrados'
                : filteredProjects.length === 1
                  ? 'project found'
                  : 'projects found'}
            </span>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-muted">
                  <Image
                    src={project.images?.[0] || '/images/no-image-available.webp'}
                    alt={project.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Industry badge overlay */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 backdrop-blur-sm text-[#212529] hover:bg-white shadow-sm font-medium">
                      {project.industry}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 flex-1">
                  <h3 className="text-lg font-semibold text-[#212529] mb-3 line-clamp-2 group-hover:text-[#fdb827] transition-colors duration-200">
                    {project.title}
                  </h3>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{project.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{project.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{project.year}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{project.scale}</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </CardContent>

                <CardFooter className="p-5 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full group/btn border-2 border-[#fdb827] text-[#fdb827] hover:bg-[#fdb827] hover:text-[#212529] transition-all duration-300 rounded-lg"
                  >
                    <Link href={`/${locale}/projects/${project.id}`}>
                      {t('labels.viewDetails')}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-[#212529] mb-2">
              {locale === 'es' ? 'No se encontraron proyectos' : 'No projects found'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {locale === 'es'
                ? 'Intenta ajustar tus filtros o términos de búsqueda.'
                : 'Try adjusting your filters or search terms.'}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setActiveCategory(ALL_CATEGORIES_KEY);
                setSearchQuery('');
              }}
            >
              {locale === 'es' ? 'Mostrar todos los proyectos' : 'Show all projects'}
            </Button>
          </div>
        )}

        <Separator className="my-16" />

        {/* Statistics Section */}
        <div className="rounded-2xl bg-[#212529] p-10 md:p-12">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-3 px-3 py-1 text-sm border-white/30 text-white/80">
              {locale === 'es' ? 'Nuestro Impacto' : 'Our Impact'}
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {locale === 'es' ? 'Por los Números' : 'By the Numbers'}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-[#fdb827] tracking-tight">
                {stats.totalProjects}
              </div>
              <div className="text-white/70 text-sm font-medium uppercase tracking-wider">
                {locale === 'es' ? 'Proyectos Totales' : 'Total Projects'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-[#fdb827] tracking-tight">
                {stats.industriesCovered}
              </div>
              <div className="text-white/70 text-sm font-medium uppercase tracking-wider">
                {locale === 'es' ? 'Industrias Cubiertas' : 'Industries Covered'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-[#fdb827] tracking-tight">
                {stats.countriesServed}
              </div>
              <div className="text-white/70 text-sm font-medium uppercase tracking-wider">
                {locale === 'es' ? 'Países Atendidos' : 'Countries Served'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-extrabold text-[#fdb827] tracking-tight">
                {stats.totalCapacity}
              </div>
              <div className="text-white/70 text-sm font-medium uppercase tracking-wider">
                {locale === 'es' ? 'Capacidad Total' : 'Total Capacity'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
