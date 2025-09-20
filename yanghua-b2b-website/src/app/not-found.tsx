'use client';

import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Log the 404 error to an error reporting service
    console.error('Page not found');
  }, []);

  return (
    <div>
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}