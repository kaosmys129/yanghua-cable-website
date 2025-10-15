import Link from "next/link";
import type { Metadata } from 'next';
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { formatDate, getStrapiURL } from "@/lib/utils";
import { StrapiImage, getStrapiMedia } from "@/components/custom/StrapiImage";
import BlockRenderer from "@/components/BlockRenderer";
import { notFound } from 'next/navigation';
import { Article } from '@/lib/types';
import { draftMode } from 'next/headers';
import { getArticleBySlug } from "@/lib/strapi-client";

// Generate static params for all articles
export async function generateStaticParams() {
  try {
    const baseUrl = "https://fruitful-presence-02d7be759c.strapiapp.com";
    const locales = ['en', 'es'];
    const params = [];
    
    for (const locale of locales) {
      const url = `${baseUrl}/api/articles?fields[0]=slug&locale=${locale}`;
      console.log(`Fetching articles for locale ${locale} from: ${url}`);
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      // Add authentication if token is available
      if (process.env.STRAPI_API_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.STRAPI_API_TOKEN}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch articles for locale ${locale}: ${response.status}`);
        continue;
      }
      
      const result = await response.json();
      console.log(`Found ${result.data?.length || 0} articles for locale ${locale}`);
      
      if (result.data && Array.isArray(result.data)) {
        for (const article of result.data) {
          if (article.slug) {
            params.push({ locale, slug: article.slug });
          }
        }
      }
    }
    
    console.log(`Total static params generated: ${params.length}`);
    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    // Fallback to empty array to allow dynamic rendering
    return [];
  }
}

// Fetch article data using native fetch
async function getArticle(slug: string, locale: string): Promise<Article | null> {
  try {
    const article = await getArticleBySlug(slug, locale as any);
    if (!article) {
      console.log(`No article found with slug: ${slug}`);
      return null;
    }
    console.log(`Article found: ${article.title}`);
    return article;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}


interface PageProps {
  params: {
    slug: string;
    locale: string;
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug, locale } = params;
  
  // Fetch article data
  const article = await getArticle(slug, locale);
  const draft = await draftMode();
  
  if (!article) {
    console.log('Article not found, calling notFound()');
    notFound();
    return; // This line should never be reached, but added for clarity
  }
  
  console.log('Article found:', article.title);

  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const articleUrl = `${baseUrl}/${locale}/articles/${slug}`;

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description || undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: article.author?.name ? { '@type': 'Person', name: article.author.name } : undefined,
    image: article.cover?.url ? getStrapiMedia(article.cover.url) || undefined : undefined,
    mainEntityOfPage: articleUrl,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: `${baseUrl}/${locale}` },
      { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Artículos' : 'Articles', item: `${baseUrl}/${locale}/articles` },
      { '@type': 'ListItem', position: 3, name: article.title, item: articleUrl },
    ],
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
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

export async function generateMetadata({ params }: { params: { slug: string; locale: string } }): Promise<Metadata> {
  const { slug, locale } = params;
  const article = await getArticle(slug, locale);
  const baseUrl = 'https://www.yhflexiblebusbar.com';
  const url = `${baseUrl}/${locale}/articles/${slug}`;
  const title = article?.title ? `${article.title} | Yanghua` : 'Article | Yanghua';
  const description = article?.description || 'Technical insights and resources from Yanghua on flexible busbar systems and applications.';
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${baseUrl}/en/articles/${slug}`,
        es: `${baseUrl}/es/articles/${slug}`,
      },
    },
  };
}
