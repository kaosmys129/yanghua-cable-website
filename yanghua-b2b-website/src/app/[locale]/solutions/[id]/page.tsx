import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, CheckCircle, ArrowRight, Zap, Wrench, Award } from 'lucide-react';
import type { Metadata } from 'next';
import LightboxImage from '@/components/LightboxImage';
import SolutionDownloadButton from '@/components/ui/SolutionDownloadButton';
import SolutionsHeroImage from '@/components/SolutionsHeroImage';
import SolutionsGallery from '@/components/SolutionsGallery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import fs from 'node:fs';
import path from 'node:path';

type Solution = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  highlights: string[];
  applications: string[];
  advantages: { title: string; description: string }[];
  technicalSpecs: { parameter: string; value: string }[];
  galleryCaptions?: { title: string; description: string }[];
};

// Generate static params for all available solutions
export async function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const solutions = t.raw('solutions') as Solution[];
  return solutions.map((solution) => ({
    id: solution.id,
  }));
}

interface PageProps {
  params: {
    id: string;
    locale: string;
  };
}

// Icon mapping for advantage cards
const ADVANTAGE_ICONS = [Zap, Wrench, Award];

export default async function SolutionDetailPage({
  params: { id, locale },
}: PageProps) {
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const solutions = t.raw('solutions') as Solution[];
  const solution = solutions.find((s) => s.id === id);

  if (!solution) {
    notFound();
  }

  // Auto/detect gallery count
  let galleryCount =
    solution.galleryCaptions && solution.galleryCaptions.length
      ? solution.galleryCaptions.length
      : 0;
  try {
    const galleryDir = path.join(
      process.cwd(),
      'public',
      'images',
      'solutions',
      solution.id,
      'gallery'
    );
    const exists = fs.existsSync(galleryDir);
    const files = exists ? fs.readdirSync(galleryDir) : [];
    const imageFiles = files.filter((f) =>
      /\.(webp|png|jpg|jpeg)$/i.test(f)
    );
    if (!galleryCount) {
      galleryCount = imageFiles.length;
    }
  } catch (e) {
    // ignore fs errors
  }
  if (!galleryCount) {
    galleryCount = 4;
  }

  return (
    <div className="bg-background">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/${locale}`}
            className="hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={`/${locale}/solutions`}
            className="hover:text-foreground transition-colors"
          >
            Solutions
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {solution.title}
          </span>
        </nav>
      </div>

      {/* Hero Image with Overlay */}
      <SolutionsHeroImage
        src={solution.image}
        alt={solution.title}
        className="h-64 sm:h-80 md:h-[28rem] lg:h-[32rem]"
        overlay
        overlayContent={
          <div className="text-white">
            <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30 backdrop-blur-sm hover:bg-white/30">
              Solution
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 drop-shadow-lg">
              {solution.title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl drop-shadow">
              {solution.subtitle}
            </p>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Description */}
        <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mb-10">
          {solution.description}
        </p>

        {/* Highlights + Applications + Detail Image */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-start">
          {/* Highlights */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#fdb827]" />
                Key Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {solution.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#fdb827]/10 flex items-center justify-center mt-0.5">
                      <span className="text-[#fdb827] text-xs font-bold">
                        {index + 1}
                      </span>
                    </span>
                    <span className="text-foreground text-sm leading-relaxed">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Applications */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#fdb827]" />
                Typical Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {solution.applications.map((application, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
                      <span className="text-muted-foreground text-xs font-bold">
                        {index + 1}
                      </span>
                    </span>
                    <span className="text-foreground text-sm leading-relaxed">
                      {application}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Detail Image (Lightbox) */}
          <LightboxImage
            src={`/images/solutions/${solution.id}/detail.webp`}
            alt={solution.title}
          />
        </div>

        <Separator className="my-12" />

        {/* Advantages Section */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Key Advantages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {solution.advantages.map((advantage, index) => {
              const IconComponent = ADVANTAGE_ICONS[index % ADVANTAGE_ICONS.length];
              return (
                <Card
                  key={index}
                  className="border border-border hover:border-[#fdb827]/30 hover:shadow-lg transition-all duration-300 group"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-[#fdb827]/10 flex items-center justify-center mb-3 group-hover:bg-[#fdb827]/20 transition-colors">
                      <IconComponent className="h-6 w-6 text-[#fdb827]" />
                    </div>
                    <CardTitle className="text-lg">{advantage.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {advantage.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator className="my-12" />

        {/* Gallery Section */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Gallery
          </h2>
          <SolutionsGallery
            solutionId={solution.id}
            solutionTitle={solution.title}
            count={galleryCount}
            captions={solution.galleryCaptions}
          />
        </section>

        <Separator className="my-12" />

        {/* Technical Specifications */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Technical Specifications
          </h2>
          <Card className="border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold w-1/3">
                    Parameter
                  </TableHead>
                  <TableHead className="font-semibold">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solution.technicalSpecs.map((spec, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {spec.parameter}
                    </TableCell>
                    <TableCell>{spec.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Have a Project in Mind?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Download the full specification sheet for more details or get in
              touch with our experts to find the perfect solution for you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <SolutionDownloadButton
                solutionId={id}
                locale={locale}
                variant="brand"
              >
                Download PDF
              </SolutionDownloadButton>
              <Link href={`/${locale}/contact`}>
                <Button variant="outline" size="lg" className="gap-2">
                  Contact Us
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page-level metadata
export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const { locale, id } = params;
  const t = await getTranslations({ locale, namespace: 'solutions' });
  const solutions = t.raw('solutions') as Solution[];
  const solution = solutions.find((s) => s.id === id);
  const titleBase = solution?.title || id;
  const titles: Record<string, string> = {
    en: `${titleBase} | Flexible Busbar Solutions | Yanghua`,
    es: `${titleBase} | Soluciones de Barras Flexibles | Yanghua`,
  };
  const descriptions: Record<string, string> = {
    en:
      solution?.description ||
      'Flexible busbar solution details and specifications.',
    es:
      solution?.description ||
      'Detalles y especificaciones de la solución de barras colectoras flexibles.',
  };
  const canonical = generateCanonicalUrl(
    getLocalizedPath('solutions-detail', locale as any, { id }),
    locale as any
  );
  const currentPathForLocale = getLocalizedPath(
    'solutions-detail',
    locale as any,
    { id }
  );
  const currentUrl = canonical;
  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      url: currentUrl,
      siteName: 'Yanghua Cable',
      type: 'article',
      locale,
    },
    alternates: {
      canonical,
      languages: generateHreflangAlternatesForMetadata(
        currentPathForLocale,
        locale as any
      ),
    },
  };
}
