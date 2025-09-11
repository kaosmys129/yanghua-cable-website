import Link from "next/link"
import { getAllArticles } from "@/lib/strapi-client"
import { formatDate } from "@/lib/utils"

import { StrapiImage } from "@/components/custom/strapi-image"

export default async function Home() {
  const articles = await getAllArticles();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Latest Articles</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.data.map((article) => (
          <Link key={article.id} href={`/articles/${article.slug}`} className="group">
            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48 w-full">
                <StrapiImage
                  src={article.cover.url || "/placeholder.svg?height=400&width=600&query=article"}
                  alt={article.cover.alternativeText || article.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                    <StrapiImage
                      src={article.author.avatar.url || "/placeholder.svg?height=50&width=50&query=avatar"}
                      alt={article.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm text-gray-600">{article.author.name}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{formatDate(article.publishedAt)}</span>
                </div>
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors duration-200">
                  {article.title}
                </h2>
                <p className="text-gray-600 line-clamp-2">{article.description}</p>
                <div className="mt-4 flex items-center">
                  <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700">
                    {article.category.name}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
