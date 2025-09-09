import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Tag, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { getArticle } from '../../news/NewsDetailServer';

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);

  return (
    <div className="min-h-screen bg-white">
      {/* Article Header */}
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700">
        <div className="absolute inset-0">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover opacity-50"
          />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-2 mb-4">
              <span className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                {article.category}
              </span>
              <span className="text-white text-sm">{article.date}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {article.title}
            </h1>
            <div className="flex items-center space-x-4 text-gray-300">
              <span>{article.author}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Article Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-lg text-gray-700 leading-relaxed">{article.summary}</p>
            </div>

            {/* Article Content */}
            <article 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Share Function */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Share this article</span>
                <div className="flex space-x-2">
                  <button className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    <span className="text-sm">Weibo</span>
                  </button>
                  <button className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    <span className="text-sm">WeChat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Article Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Published: {article.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Read Time: {article.readTime}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-700">Author: {article.author}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-700">Category: {article.category}</span>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Global New Energy Market Flexible Bus Demand Grows 35%',
                    date: '2024-12-10',
                    category: 'Industry Trends'
                  },
                  {
                    title: 'Technical White Paper: Large Current Transmission System Efficiency Optimization',
                    date: '2024-12-05',
                    category: 'Technical Articles'
                  },
                  {
                    title: 'Data Center Power Distribution System Upgrade Comparative Analysis',
                    date: '2024-11-28',
                    category: 'Technical Articles'
                  }
                ].map((related, index) => (
                  <Link
                    key={index}
                    href={`/news/${index + 2}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {related.title}
                    </h4>
                    <div className="text-xs text-gray-600">
                      {related.date} • {related.category}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Subscription Area */}
            <div className="bg-yellow-500 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscribe</h3>
              <p className="text-sm text-gray-700 mb-4">
                Get the latest updates and technical articles from Yanghua Tech
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Your Email Address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors"
                >
                  Subscribe Now
                </button>
              </form>
            </div>

            {/* Popular Tags */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {['New Energy', 'Technological Innovation', 'Data Center', 'Policy Interpretation', 'Market Analysis', 'Product Launch'].map((tag) => (
                  <Link
                    key={tag}
                    href={`/news/tag/${tag.toLowerCase()}`}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Link
          href="/news"
          className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to News List
        </Link>
      </div>
    </div>
  );
}