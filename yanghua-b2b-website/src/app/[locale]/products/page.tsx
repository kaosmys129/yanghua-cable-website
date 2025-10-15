'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';

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

  // Handle empty categories gracefully
  if (!productCategories || productCategories.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
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
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('common.noProductsAvailable', { defaultValue: 'No products available at the moment' })}
            </h2>
            <p className="text-gray-600">
              {t('common.productsLoadingError', { defaultValue: 'We are experiencing technical difficulties. Please try again later.' })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD: CollectionPage for Products */}
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
        {/* Product Overview */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#212529] mb-4">
            {t('overview.title')}
          </h2>
          <p className="text-lg text-[#6c757d] max-w-3xl mx-auto">
            {t('overview.subtitle')}
          </p>
        </div>

        {/* Product Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {productCategories.map((category, index) => (
            <div key={category.name} className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#212529] mb-2">
                    {category.name}
                  </h3>
                  <p className="text-[#6c757d] leading-relaxed">
                    {category.description}
                  </p>
                </div>
                <div className="bg-[#fdb827] text-[#212529] px-3 py-1 rounded-full text-sm font-semibold">
                  {category.models.length} {t('common.models')}
                </div>
              </div>

              {/* Models */}
              <div className="mb-6">
                <h4 className="font-semibold text-[#212529] mb-3">{t('common.availableModels')}</h4>
                <div className="flex flex-wrap gap-2">
                  {category.models.map((model: string) => (
                    <span key={model} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm">
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              {/* Product Image */} 
              <div className="mb-6">
                <div className="relative w-full h-48 rounded-xl overflow-hidden">
                  <Image
                    src={category.productIndex !== undefined ? `/images/product-center/${category.productIndex}.jpg` : '/placeholder-image.jpg'}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={false}
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link href={`/${locale}/products/category/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}>
                <button className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-md hover:bg-yellow-600 transition-colors w-full">
                  {t('common.exploreProducts', {categoryName: category.name})}
                </button>
              </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Specifications Summary */}
        <div className="bg-[#f8f9fa] rounded-lg p-8">
          <h3 className="text-2xl font-bold text-[#212529] mb-6 text-center">
            {t('specifications.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-[#fdb827] w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#212529]">200-6300</span>
              </div>
              <h4 className="font-semibold text-[#212529] mb-2">{t('specifications.currentRange.title')}</h4>
              <p className="text-sm text-[#6c757d]">{t('specifications.currentRange.description')}</p>
            </div>
            <div className="text-center">
              <div className="bg-[#fdb827] w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#212529]">≤3kV</span>
              </div>
              <h4 className="font-semibold text-[#212529] mb-2">{t('specifications.ratedVoltage.title')}</h4>
              <p className="text-sm text-[#6c757d]">{t('specifications.ratedVoltage.description')}</p>
            </div>
            <div className="text-center">
              <div className="bg-[#fdb827] w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#212529]">IP68</span>
              </div>
              <h4 className="font-semibold text-[#212529] mb-2">{t('specifications.protectionLevel.title')}</h4>
              <p className="text-sm text-[#6c757d]">{t('specifications.protectionLevel.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}