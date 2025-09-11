import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getArticleBySlug } from "@/lib/strapi-client";
import { StrapiLocale } from "strapi-sdk-js";
import { StrapiImage } from "@/components/custom/strapi-image";
import BlockRenderer from "@/components/block-renderer";

export default async function ArticlePage({
  params,
}: {
  params: {
    slug: string;
    locale: string;
  };
}) {
  const article = await getArticleBySlug(
    params.slug,
    params.locale as StrapiLocale
  );

  console.log("article with simplified populate", JSON.stringify(article, null, 2));

  if (!article) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to articles
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="container py-8">
        <Link
          href={`/${params.locale}/articles`}
          className="inline-flex items-center mb-8 text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to articles
        </Link>

        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center text-gray-500 mb-8">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
            <StrapiImage
              src={article.author.avatar.url}
              alt={article.author.avatar.alternativeText || "Author avatar"}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-semibold">{article.author.name}</p>
            <p className="text-sm">
              {new Date(article.publishedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="w-full h-96 relative rounded-lg overflow-hidden mb-8">
          <StrapiImage
            src={article.cover.url}
            alt={article.cover.alternativeText || "Article cover image"}
            fill
            className="object-cover"
          />
        </div>

        <div className="mt-8">
          {article.blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      </div>
    </main>
  );
}
