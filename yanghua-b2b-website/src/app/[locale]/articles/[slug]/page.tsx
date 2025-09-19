'use client';

import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StrapiImage } from "@/components/custom/strapi-image";
import BlockRenderer from "@/components/block-renderer";
import { useArticle, useArticleWithDrafts } from '@/lib/queries';
import ArticleErrorBoundary, { 
  ArticleDetailErrorFallback, 
  ArticleDetailSkeleton 
} from '@/components/ui/ArticleErrorBoundary';
import { useParams, useSearchParams } from 'next/navigation';


function ArticleContent() {
  const { slug, locale } = useParams<{ slug: string; locale: string }>();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  
  // Always call both hooks to avoid conditional hook calls
  const draftData = useArticleWithDrafts(slug, locale);
  const publishedData = useArticle(slug, locale);
  
  // Use the appropriate data based on preview mode
  const articleData = isPreview ? draftData : publishedData;
  const { data: article, isLoading, isError, error } = articleData;

  if (isLoading) {
    return <ArticleDetailSkeleton />;
  }

  if (isError) {
    console.error('Error loading article:', error);
    return <ArticleDetailErrorFallback error={error} />;
  }

  if (!article) {
    return <ArticleDetailErrorFallback />;
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Preview Mode Alert */}
      {isPreview && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
            <div className="text-orange-800">
              <strong>预览模式</strong> - 您正在查看草稿内容，此内容可能尚未发布。
            </div>
          </div>
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

export default function ArticlePage() {
  return (
    <ArticleErrorBoundary fallback={ArticleDetailErrorFallback}>
      <ArticleContent />
    </ArticleErrorBoundary>
  );
}
