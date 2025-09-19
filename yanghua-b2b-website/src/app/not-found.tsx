'use client';

export default function NotFound() {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🔍</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
              <p className="text-gray-600">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}