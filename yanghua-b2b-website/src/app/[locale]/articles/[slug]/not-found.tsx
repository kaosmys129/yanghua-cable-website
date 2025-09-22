import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Article Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The article you are looking for does not exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/en/articles"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Articles
          </Link>
          
          <div>
            <Link 
              href="/en"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}