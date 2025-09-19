import Link from "next/link"
import { formatDate } from "@/lib/utils"
import BlockRenderer from "@/components/BlockRenderer"
import { ArrowLeft } from "lucide-react"
import { StrapiImage } from "@/components/custom/StrapiImage"
import { articles } from "@/lib/data"

export default function StaticTestArticlePage() {
  // Use the first article from mock data for testing
  const article = articles[0]

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to articles
      </Link>

      <article>
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#212529] leading-tight">{article.title}</h1>
          <div className="flex items-center mb-8">
            <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
              <StrapiImage
                src={article.author?.avatar?.url || "/placeholder.svg?height=50&width=50&query=avatar"}
                alt={article.author?.name || "Author"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-[#212529] text-lg">{article.author?.name || "Unknown Author"}</p>
              <p className="text-[#6c757d]">Published on {formatDate(article.publishedAt)}</p>
            </div>
            <div className="ml-auto">
              <span className="inline-block bg-[#fdb827] text-[#212529] rounded-full px-4 py-2 text-sm font-semibold">
                {article.category?.name || "Uncategorized"}
              </span>
            </div>
          </div>
        </div>

        <div className="relative w-full h-96 mb-12 rounded-xl overflow-hidden shadow-lg">
          <StrapiImage
            src={article.cover?.url || "/placeholder.svg?height=600&width=1200&query=article cover"}
            alt={article.cover?.alternativeText || article.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="prose prose-lg max-w-none prose-headings:text-[#212529] prose-p:text-[#6c757d] prose-p:leading-relaxed prose-a:text-[#fdb827] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#212529]">
          {article.blocks.map((block: any, index: number) => (
            <BlockRenderer key={index} block={block} />
          ))}
        </div>
      </article>

      {/* Debug info for testing */}
      <div className="mt-12 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Static Test Page Debug Info:</h3>
        <p className="text-sm text-gray-600">Article ID: {article.id}</p>
        <p className="text-sm text-gray-600">Slug: {article.slug}</p>
        <p className="text-sm text-gray-600">Blocks count: {article.blocks.length}</p>
        <p className="text-sm text-gray-600">Data source: Mock data from /lib/data.ts</p>
      </div>
    </main>
  )
}