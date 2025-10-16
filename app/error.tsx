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
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="inline-block bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

