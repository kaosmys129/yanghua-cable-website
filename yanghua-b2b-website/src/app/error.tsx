'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
          {/* 仅在开发模式展示可序列化的错误信息，避免直接渲染对象 */}
          {error.message}
          {error.stack}
        </pre>
      )}
    </div>
  );
}