
import { getCachedAllArticles } from '@/lib/cached-api';
import ArticlesList from '@/components/ArticlesList';
import { StrapiLocale } from 'strapi-sdk-js';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SEO_CONFIG } from '@/lib/seo';

// Add metadata generation
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: 'seo' });
  
  return {
    title: `Latest Articles | ${SEO_CONFIG.siteName}`,
    description: 'Stay updated with our latest insights, industry news, and expert perspectives from Yanghua',
    alternates: {
      canonical: `${SEO_CONFIG.siteUrl}/${locale}/articles`,
    },
  };
}

export default async function ArticlesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || 'en';
  
  // Fetch data on the server with caching
  let initialArticles = [];
  try {
    const result = await getCachedAllArticles(locale as StrapiLocale);
    initialArticles = result.data || [];
  } catch (error) {
    console.error('Failed to fetch articles on server:', error);
    // We'll let the client component handle the error state or retry
  }

  return (
    <main className="container mx-auto px-4 py-12">
      {/* JSON-LD: CollectionPage for Articles */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Articles',
            description: 'Latest insights, industry news, and expert perspectives from Yanghua',
            url: `https://www.yhflexiblebusbar.com/${locale}/articles`,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: initialArticles.map((article, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `https://www.yhflexiblebusbar.com/${locale}/articles/${article.slug}`,
                name: article.title
              }))
            }
          })
        }}
      />
      
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#212529]">Latest Articles</h1>
        <p className="text-lg text-[#6c757d] max-w-2xl mx-auto">
          Stay updated with our latest insights, industry news, and expert perspectives
        </p>
      </div>
      
      {/* Pass initial data to client component for hydration */}
      <ArticlesList initialData={initialArticles} />
    </main>
  );
}
