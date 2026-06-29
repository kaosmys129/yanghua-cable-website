'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Building2,
  Zap,
  CheckCircle2,
  Quote,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { useLocale } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import QuickInquiry from '@/components/features/QuickInquiry';

interface ProjectResult {
  metric: string;
  value: string;
}

interface RelatedProject {
  title: string;
  industry: string;
}

interface Project {
  id: string;
  title: string;
  client: string;
  industry: string;
  location: string;
  duration: string;
  completionDate: string;
  projectScale: string;
  challenge: string;
  solution: string;
  challenges: string[];
  solutionPoints: string[];
  results: ProjectResult[];
  productsUsed: string[];
  images: string[];
  testimonial?: string;
  testimonialAuthor?: string;
  testimonialPosition?: string;
}

interface ProjectDetailClientProps {
  project: Project;
  csrfToken: string;
  translations: {
    backToProjects: string;
    viewDetails: string;
    projectLocation: string;
    completionDate: string;
    projectScale: string;
    projectDuration: string;
    challenges: string;
    solution: string;
    results: string;
    products: string;
    projectGallery: string;
    testimonial: string;
    relatedProjects: string;
    quickInquiry: string;
    projectInformation: string;
    client: string;
    industry: string;
    location: string;
    overview: string;
    overviewTitle: string;
    projectNotFound: string;
    projectNotFoundDesc: string;
  };
  relatedProjects: Array<{ title: string; industry: string }>;
}

function PlaceholderImage({ className }: { className?: string }) {
  return (
    <div
      className={`bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center ${className}`}
    >
      <span className="text-muted-foreground text-sm">Image Not Available</span>
    </div>
  );
}

export default function ProjectDetailClient({
  project,
  csrfToken,
  translations: t,
  relatedProjects,
}: ProjectDetailClientProps) {
  const locale = useLocale();

  const overviewStats = [
    { icon: MapPin, label: t.projectLocation, value: project.location },
    { icon: Calendar, label: t.completionDate, value: project.completionDate },
    { icon: Users, label: t.projectScale, value: project.projectScale },
    { icon: Clock, label: t.projectDuration, value: project.duration },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ========== Hero Section ========== */}
      <div className="relative h-[450px] md:h-[500px] bg-[#212529] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {project.images[0] ? (
            <Image
              src={project.images[0]}
              alt={project.title}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
          ) : (
            <PlaceholderImage className="w-full h-full opacity-40" />
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16">
          {/* Back Link */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white/80 hover:text-white hover:bg-white/10 -ml-3"
            >
              <Link href={`/${locale}/projects`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.backToProjects}
              </Link>
            </Button>
          </div>

          {/* Badge */}
          <Badge className="self-start mb-4 bg-[#fdb827] text-[#212529] hover:bg-[#fdb827]/90 px-3 py-1 text-sm font-medium border-0">
            {project.industry}
          </Badge>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">
            {project.title}
          </h1>

          {/* Client */}
          <div className="flex items-center gap-2 text-white/80 text-lg">
            <Building2 className="h-5 w-5" />
            <span>
              {locale === 'es'
                ? `Solución de barras flexibles para ${project.client}`
                : `Flexible busbar solution for ${project.client}`}
            </span>
          </div>
        </div>
      </div>

      {/* ========== Quick Stats Bar ========== */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {overviewStats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center py-6 px-4">
                <div className="w-10 h-10 rounded-full bg-[#fdb827]/10 flex items-center justify-center mb-2">
                  <stat.icon className="h-5 w-5 text-[#fdb827]" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {stat.label}
                </span>
                <span className="text-sm font-semibold text-foreground text-center">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== Main Content with Tabs ========== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#fdb827]" />
                    <span className="text-muted-foreground">{t.client}:</span>
                    <span className="font-medium">{project.client}</span>
                  </div>
                  <Separator orientation="vertical" className="h-5 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#fdb827]" />
                    <span className="text-muted-foreground">{t.industry}:</span>
                    <span className="font-medium">{project.industry}</span>
                  </div>
                  <Separator orientation="vertical" className="h-5 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#fdb827]" />
                    <span className="text-muted-foreground">{t.location}:</span>
                    <span className="font-medium">{project.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Content Organization */}
            <Tabs defaultValue="challenges" className="w-full">
              <TabsList className="w-full justify-start rounded-xl bg-muted/50 p-1 gap-1">
                <TabsTrigger
                  value="challenges"
                  className="rounded-lg data-[state=active]:bg-[#fdb827] data-[state=active]:text-[#212529] data-[state=active]:shadow-sm font-medium"
                >
                  {t.challenges} & {t.solution}
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="rounded-lg data-[state=active]:bg-[#fdb827] data-[state=active]:text-[#212529] data-[state=active]:shadow-sm font-medium"
                >
                  {t.results}
                </TabsTrigger>
                <TabsTrigger
                  value="gallery"
                  className="rounded-lg data-[state=active]:bg-[#fdb827] data-[state=active]:text-[#212529] data-[state=active]:shadow-sm font-medium"
                >
                  {t.projectGallery}
                </TabsTrigger>
              </TabsList>

              {/* Challenges & Solution Tab */}
              <TabsContent value="challenges" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Challenges */}
                  <Card className="border-0 shadow-sm h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{t.challenges}</h2>
                      </div>
                      {project.challenges.length > 0 ? (
                        <ul className="space-y-3">
                          {project.challenges.map((challenge, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 text-muted-foreground leading-relaxed"
                            >
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground leading-relaxed">{project.challenge}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Solution */}
                  <Card className="border-0 shadow-sm h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">{t.solution}</h2>
                      </div>
                      {project.solutionPoints.length > 0 ? (
                        <ul className="space-y-3">
                          {project.solutionPoints.map((point, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 text-muted-foreground leading-relaxed"
                            >
                              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground leading-relaxed">{project.solution}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="mt-6 space-y-6">
                {/* Results Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {project.results.map((result, index) => (
                    <Card
                      key={index}
                      className="border-0 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl md:text-4xl font-extrabold text-[#fdb827] mb-2 tracking-tight">
                          {result.value}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          {result.metric}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Products Used */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[#fdb827]" />
                      {t.products}
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {project.productsUsed.map((product, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm bg-[#fdb827]/10 text-[#212529] hover:bg-[#fdb827]/20 border-0 font-medium"
                        >
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm group cursor-pointer"
                    >
                      {image ? (
                        <>
                          <Image
                            src={image}
                            alt={`${project.title} - Image ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </>
                      ) : (
                        <PlaceholderImage className="w-full h-full" />
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Testimonial */}
            <Card className="border-0 bg-[#212529] text-white overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="flex items-start gap-4">
                  <Quote className="h-10 w-10 text-[#fdb827] flex-shrink-0 opacity-80" />
                  <div>
                    <p className="text-lg md:text-xl text-white/90 italic leading-relaxed mb-6">
                      &ldquo;{project.testimonial || 'No testimonial available'}&rdquo;
                    </p>
                    <Separator className="mb-4 bg-white/20" />
                    <div>
                      <p className="font-semibold text-white">
                        {project.testimonialAuthor || 'Anonymous'}
                      </p>
                      <p className="text-sm text-white/60">
                        {project.testimonialPosition || 'Client'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Project Information */}
            <Card className="border-0 shadow-sm sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#fdb827]" />
                  {t.projectInformation}
                </h3>
                <Separator />
                <div className="space-y-3.5">
                  <InfoRow label={t.client} value={project.client} />
                  <InfoRow label={t.industry} value={project.industry} />
                  <InfoRow label={t.location} value={project.location} />
                  <InfoRow label={t.projectScale} value={project.projectScale} />
                  <InfoRow label={t.projectDuration} value={project.duration} />
                  <InfoRow label={t.completionDate} value={project.completionDate} />
                </div>
              </CardContent>
            </Card>

            {/* Quick Inquiry */}
            <Card className="border-0 bg-[#fdb827] text-[#212529] shadow-sm">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold">{t.quickInquiry}</h3>
                <p className="text-sm text-[#212529]/70">
                  {locale === 'es'
                    ? '¿Interesado en un proyecto similar? Contáctenos ahora.'
                    : 'Interested in a similar project? Contact us now.'}
                </p>
                <QuickInquiry
                  projectId={project.id}
                  projectTitle={project.title}
                  csrfToken={csrfToken}
                />
              </CardContent>
            </Card>

            {/* Related Projects */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">{t.relatedProjects}</h3>
                <Separator />
                <div className="space-y-2">
                  {relatedProjects.map((rp, index) => (
                    <Link
                      key={index}
                      href={`/${locale}/projects/${rp.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div>
                        <div className="font-medium text-sm text-foreground group-hover:text-[#fdb827] transition-colors">
                          {rp.title}
                        </div>
                        <div className="text-xs text-muted-foreground">{rp.industry}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#fdb827] transition-all group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full mt-2 border-[#fdb827] text-[#fdb827] hover:bg-[#fdb827] hover:text-[#212529]"
                >
                  <Link href={`/${locale}/projects`}>
                    {t.backToProjects}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* Helper component for info rows */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
