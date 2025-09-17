'use client';

import { useArticles } from '@/lib/queries';
import { getStrapiURL } from '@/lib/utils';

export default function TestCloudPage() {
  const { data: articles, isLoading, error, isError } = useArticles();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Strapi Cloud Connection Test</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Configuration</h2>
        <p><strong>Strapi URL:</strong> {getStrapiURL()}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        {isLoading && (
          <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">
            🔄 Loading articles from Strapi Cloud...
          </div>
        )}
        
        {isError && (
          <div className="p-4 bg-red-100 text-red-800 rounded-lg">
            ❌ Error: {error?.message || 'Failed to fetch articles'}
            {error && 'originalError' in error && (
              <details className="mt-2">
                <summary>Technical Details</summary>
                <pre className="mt-2 text-sm">
                  {JSON.stringify((error as any).originalError, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        
        {articles && (
          <div className="p-4 bg-green-100 text-green-800 rounded-lg">
            ✅ Successfully connected! Fetched {articles.length} articles
          </div>
        )}
      </div>

      {articles && articles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Articles from Strapi Cloud</h2>
          <div className="grid gap-4">
            {articles.slice(0, 3).map((article) => (
              <div key={article.id} className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{article.title}</h3>
                <p className="text-gray-600 mt-2">
                  {article.description || 'No description available'}
                </p>
                <div className="mt-2 text-sm text-gray-500">
                  <span>ID: {article.id}</span>
                  {article.slug && <span className="ml-4">Slug: {article.slug}</span>}
                  {article.publishedAt && (
                    <span className="ml-4">
                      Published: {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {articles.length > 3 && (
            <p className="mt-4 text-gray-600">
              ... and {articles.length - 3} more articles
            </p>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800">Test Instructions</h3>
        <ul className="mt-2 text-yellow-700 list-disc list-inside">
          <li>Check if articles load successfully from Strapi Cloud</li>
          <li>Verify error handling for network issues</li>
          <li>Test retry mechanism by temporarily disconnecting internet</li>
          <li>Check browser console for detailed logs</li>
        </ul>
      </div>
    </div>
  );
}