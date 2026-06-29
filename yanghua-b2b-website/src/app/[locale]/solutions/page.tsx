'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle,
  Search,
  X,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

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
};

// Category labels for filtering (derived from solution id)
const CATEGORY_LABELS: Record<string, string> = {
  'new-energy': 'New Energy',
  'power-system': 'Power Systems',
  manufacturing: 'Manufacturing',
  'data-center': 'Data Centers',
  'charging-station': 'EV Charging',
  metallurgy: 'Metallurgy',
  'wind-farm': 'Wind Energy',
};

function getSolutions(t: any): Solution[] {
  try {
    const solutionsData = t.raw('solutions');
    return Array.isArray(solutionsData) ? solutionsData : [];
  } catch (error) {
    console.error('Error loading solutions data:', error);
    return [];
  }
}

export default function SolutionsPage() {
  const params = useParams() as Record<string, string | undefined>;
  const locale = (params?.locale ?? 'en') as string;
  const t = useTranslations('solutions');
  const solutions = getSolutions(t);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Derived data
  const categories = useMemo(() => {
    const cats = new Set<string>();
    solutions.forEach((s) => {
      if (s.id && CATEGORY_LABELS[s.id]) cats.add(s.id);
    });
    return Array.from(cats);
  }, [solutions]);

  const filteredSolutions = useMemo(() => {
    return solutions.filter((solution) => {
      const matchesSearch =
        !searchQuery ||
        solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        solution.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        solution.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || solution.id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [solutions, searchQuery, selectedCategory]);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredSolutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSolutions = filteredSolutions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Empty state
  if (!solutions || solutions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t('page.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('common.noSolutionsAvailable') ||
                'No solutions available at the moment'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: t('page.title'),
            description: t('page.description'),
            url: `https://www.yhflexiblebusbar.com/${locale}/solutions`,
          }),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            {t('page.title')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('page.description')}
          </p>
        </div>

        <Separator className="mb-10" />

        {/* Search & Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search solutions..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1.5 text-sm"
                onClick={() => handleCategoryChange(cat)}
              >
                {CATEGORY_LABELS[cat] || cat}
              </Badge>
            ))}
            {selectedCategory && (
              <Badge
                variant="secondary"
                className="cursor-pointer px-3 py-1.5 text-sm"
                onClick={() => handleCategoryChange(selectedCategory)}
              >
                Clear filter
                <X className="ml-1 h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {filteredSolutions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              No solutions found matching your criteria.
            </p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="mt-2"
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            {/* Solutions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentSolutions.map((solution, i) => (
                <Link
                  key={solution.id}
                  href={`/${locale}/solutions/${solution.id}`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={solution.image}
                        alt={solution.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading={i < 3 ? 'eager' : 'lazy'}
                      />
                      {/* Category badge overlay */}
                      {CATEGORY_LABELS[solution.id] && (
                        <div className="absolute top-3 left-3">
                          <Badge
                            variant="secondary"
                            className="bg-background/90 text-foreground backdrop-blur-sm shadow-sm"
                          >
                            {CATEGORY_LABELS[solution.id]}
                          </Badge>
                        </div>
                      )}
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <CardContent className="p-6 flex-grow">
                      <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {solution.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {solution.subtitle}
                      </p>
                      {solution.highlights && solution.highlights.length > 0 && (
                        <ul className="space-y-2">
                          {solution.highlights.slice(0, 2).map((highlight, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle className="h-4 w-4 text-[#fdb827] mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>

                    <CardFooter className="px-6 pb-6 pt-0">
                      <div className="flex items-center text-sm font-medium text-[#fdb827] group-hover:gap-2 transition-all">
                        {t('common.viewDetails') || 'View Details'}
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          if (currentPage > 1) goToPage(currentPage - 1);
                        }}
                        className={
                          currentPage === 1
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        // Show ellipsis for large page counts
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1;

                        if (!showPage) {
                          if (page === 2 || page === totalPages - 1) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        }

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.preventDefault();
                                goToPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            goToPage(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                {/* Page info */}
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  Showing {startIndex + 1}–
                  {Math.min(endIndex, filteredSolutions.length)} of{' '}
                  {filteredSolutions.length} solutions
                </p>
              </div>
            )}
          </>
        )}

        {/* Bottom CTA Section */}
        <Separator className="my-16" />
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {t('cta.customSolution.title')}
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {t('cta.customSolution.description')}
          </p>
          <Link href="/contact">
            <Button variant="brand" size="lg" className="gap-2">
              {t('common.contactUs') || 'Contact Us'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
