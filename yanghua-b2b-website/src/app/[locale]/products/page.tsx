import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { generateCanonicalUrl, generateHreflangAlternatesForMetadata } from '@/lib/seo';
import { getLocalizedPath } from '@/lib/url-localization';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bolt, Cable, Shield, Zap } from 'lucide-react';

export default function ProductsPage() {
  const t = useTranslations('products');
  const locale = useLocale();

  const getProductCategories = () => {
    try {
      const categories = t.raw('categories');
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.error('Error loading product categories:', error);
      return [];
    }
  };

  const productCategories = getProductCategories();

  if (!productCategories || productCategories.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative bg-gradient-to-r from-[#212529] to-gray-700 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="text-center p-12">
            <CardHeader>
              <CardTitle className="text-2xl">
                {t('common.noProductsAvailable', { defaultValue: 'No products available at the moment' })}
              </CardTitle>
              <CardDescription>
                {t('common.productsLoadingError', { defaultValue: 'We are experiencing technical difficulties. Please try again later.' })}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD */}
      {(() => {
        const baseUrl = 'https://www.yhflexiblebusbar.com';
        const collectionJsonLd = {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: t('hero.title'),
          description: t('hero.subtitle'),
          url: `${baseUrl}/${locale}/products`,
        };
        return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />;
      })()}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#212529] to-gray-700 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 text-white border-white/30 bg-white/10 text-sm py-1 px-4">
              {locale === 'es' ? 'Nuestros Productos' : 'Our Products'}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Product Overview */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t('overview.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('overview.subtitle')}
          </p>
        </div>

        {/* Product Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {productCategories.map((category, index) => (
            <Card
              key={category.name}
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </CardTitle>
                    <CardDescription className="leading-relaxed text-base">
                      {category.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-[#fdb827] text-[#212529] hover:bg-[#fdb827] ml-3 shrink-0 font-bold"
                  >
                    {category.models.length} {t('common.models')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pb-0">
                {/* Models */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
                    {t('common.availableModels')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {category.models.map((model: string) => (
                      <Badge key={model} variant="secondary" className="font-mono text-xs">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Product Image */}
                {(() => {
                  // Maps category names (English & Spanish) to image filenames
                  const categoryImageMap: Record<string, string> = {
                    'General Purpose Cables': 'general-purpose-cables',
                    'Fire Resistant Cables': 'fire-resistant-cables',
                    'Low Smoke & Halogen-Free Cables': 'low-smoke-halogen-free-cables',
                    'Cables de Propósito General': 'general-purpose-cables',
                    'Cables Resistentes al Fuego': 'fire-resistant-cables',
                    'Cables Libres de Humo y Halógenos': 'low-smoke-halogen-free-cables',
                  };
                  const imageSlug = categoryImageMap[category.name]
                    || category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
                  const imageSrc = `/images/product-center/${imageSlug}.jpg`;
                  return (
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#f0f0f0] p-4">
                      <Image
                        src={imageSrc}
                        alt={category.name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-500 p-2"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={false}
                        onError={(e) => {
                          // Hide broken image, show fallback via parent styling
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {/* Fallback: shown when image fails to load */}
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                        <Cable className="h-12 w-12 opacity-20" />
                      </div>
                    </div>
                  );
                })()}
              </CardContent>

              <CardFooter className="pt-6">
                <Link
                  href={`/${locale}/products/category/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className="w-full"
                >
                  <button className="w-full inline-flex items-center justify-center rounded-md bg-[#fdb827] text-[#212529] font-semibold h-11 px-6 hover:bg-[#e5a61e] transition-colors shadow-sm hover:shadow-md">
                    <Zap className="h-4 w-4 mr-2" />
                    {t('common.exploreProducts', { categoryName: category.name })}
                  </button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Technical Specifications Summary - Desktop */}
        <div className="hidden md:block">
          <Card className="bg-muted/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <Bolt className="h-6 w-6 text-primary" />
                {t('specifications.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-[#fdb827] w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-xl font-bold text-[#212529]">200-6300</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    {t('specifications.currentRange.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('specifications.currentRange.description')}
                  </p>
                </div>
                <div className="text-center p-6 rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-[#fdb827] w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <span className="text-xl font-bold text-[#212529]">≤3kV</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    {t('specifications.ratedVoltage.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('specifications.ratedVoltage.description')}
                  </p>
                </div>
                <div className="text-center p-6 rounded-lg bg-background shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-[#fdb827] w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Shield className="h-8 w-8 text-[#212529]" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    {t('specifications.protectionLevel.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('specifications.protectionLevel.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile specs accordion */}
        <div className="md:hidden">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="specs">
              <AccordionTrigger className="text-lg font-bold">
                <span className="flex items-center gap-2">
                  <Bolt className="h-5 w-5 text-primary" />
                  {t('specifications.title')}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="bg-[#fdb827] w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                      <span className="font-bold text-[#212529] text-sm">200-6300</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{t('specifications.currentRange.title')}</h4>
                      <p className="text-xs text-muted-foreground">{t('specifications.currentRange.description')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="bg-[#fdb827] w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                      <span className="font-bold text-[#212529] text-sm">≤3kV</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{t('specifications.ratedVoltage.title')}</h4>
                      <p className="text-xs text-muted-foreground">{t('specifications.ratedVoltage.description')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="bg-[#fdb827] w-12 h-12 rounded-lg flex items-center justify-center shrink-0">
                      <Shield className="h-6 w-6 text-[#212529]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{t('specifications.protectionLevel.title')}</h4>
                      <p className="text-xs text-muted-foreground">{t('specifications.protectionLevel.description')}</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params?.locale || 'en';
  const t = await getTranslations({ locale, namespace: 'seo.pages.products' });

  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const localizedPath = getLocalizedPath('products', locale as any);
  const canonical = generateCanonicalUrl(localizedPath, locale as any, baseUrl);
  const hreflangAlternates = generateHreflangAlternatesForMetadata(localizedPath, locale as any);

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: canonical,
      languages: hreflangAlternates,
    },
  };
}
