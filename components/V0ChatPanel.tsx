'use client';

import { useState, useEffect } from 'react';

export default function V0ChatPanel({
  prototypeId,
  v0ProjectId,
  isReadOnly,
  prNumber,
}: {
  prototypeId: string;
  v0ProjectId: string;
  isReadOnly: boolean;
  prNumber?: number | null;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isReadOnly) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            This prototype has been submitted for review
          </h3>
          <p className="text-gray-600 mb-6">
            No further changes can be made. The code has been submitted as a Pull Request.
          </p>
          {prNumber && (
            <a
              href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/pull/${prNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              View Pull Request #{prNumber} ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI assistant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load AI assistant
          </h3>
          <p className="text-gray-600 mb-6">
            There was an error loading the v0 chat interface. Please try reloading.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // In production, this would embed the actual v0 chat interface
  // For now, we'll show a placeholder
  return (
    <div className="h-full">
      <div className="h-full flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            v0 AI Assistant
          </h3>
          <p className="text-gray-600 mb-4">
            The v0 chat interface would be embedded here. You would be able to:
          </p>
          <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
            <li>💬 Chat with AI to modify your prototype</li>
            <li>✨ Describe changes in natural language</li>
            <li>🔄 Iterate on your design and functionality</li>
            <li>👀 See changes reflected in the preview</li>
          </ul>
          <p className="text-xs text-gray-500">
            Project ID: {v0ProjectId}
          </p>
        </div>
      </div>
    </div>
  );
}

