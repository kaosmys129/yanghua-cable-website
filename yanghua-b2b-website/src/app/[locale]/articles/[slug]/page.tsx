import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { formatDate, getStrapiURL } from "@/lib/utils";
import { StrapiImage } from "@/components/custom/StrapiImage";
import BlockRenderer from "@/components/BlockRenderer";
import { notFound } from 'next/navigation';
import { Article } from '@/lib/types';
import { draftMode } from 'next/headers';

// Generate static params for all articles
export async function generateStaticParams() {
  const articleSlugs = [
    'company-news-1',
    'industry-insights-1', 
    'product-updates-1',
    'technology-trends-1',
    'market-analysis-1',
    'case-study-1',
    'innovation-spotlight-1',
    'sustainability-report-1',
    'partnership-announcement-1',
    'quarterly-review-1'
  ];
  const locales = ['en', 'es'];
  
  const params = [];
  for (const locale of locales) {
    for (const slug of articleSlugs) {
      params.push({ locale, slug });
    }
  }
  
  return params;
}

// Fetch article data
async function getArticle(slug: string, locale: string): Promise<Article | null> {
  try {
    const strapiUrl = getStrapiURL();
    const draft = await draftMode();
    const publicationState = draft.isEnabled ? 'preview' : 'live';
    
    const response = await fetch(
      `${strapiUrl}/api/articles?filters[slug][$eq]=${slug}&locale=${locale}&publicationState=${publicationState}&populate=*`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
        next: { revalidate: draft.isEnabled ? 0 : 60 }, // No revalidation in preview mode
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}


interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug, locale } = await params;
  
  // Fetch article data
  const article = await getArticle(slug, locale);
  const draft = await draftMode();
  
  if (!article) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      {draft.isEnabled && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <p className="font-medium">Preview Mode Active</p>
          </div>
          <p className="text-sm mt-1">You are viewing this article in preview mode. This content may not be published yet.</p>
        </div>
      )}
      <div className="container py-8">
        <Link
          href={`/${locale}/articles`}
          className="inline-flex items-center mb-8 text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to articles
        </Link>

        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center text-gray-500 mb-8">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
            <StrapiImage
              src={article.author?.avatar?.url || "/placeholder.svg?height=48&width=48&query=avatar"}
              alt={article.author?.avatar?.alternativeText || "Author avatar"}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-semibold">{article.author?.name || "Unknown Author"}</p>
            <p className="text-sm">
              {new Date(article.publishedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="w-full h-96 relative rounded-lg overflow-hidden mb-8">
          <StrapiImage
            src={article.cover?.url || "/placeholder.svg?height=400&width=800&query=cover"}
            alt={article.cover?.alternativeText || "Article cover image"}
            fill
            className="object-cover"
          />
        </div>

        <div className="mt-8">
          {article.blocks?.map((block: any) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      </div>
    </main>
  );
}
