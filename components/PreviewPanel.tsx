'use client';

import { useState, useEffect } from 'react';

export default function PreviewPanel({
  prototypeId,
  previewUrl,
  branchName,
}: {
  prototypeId: string;
  previewUrl: string | null;
  branchName: string;
}) {
  const [currentUrl, setCurrentUrl] = useState(previewUrl);
  const [isDeploying, setIsDeploying] = useState(!previewUrl);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!previewUrl) {
      // Poll for deployment status
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/prototype/${prototypeId}`);
          const data = await response.json();
          
          if (data.previewUrl) {
            setCurrentUrl(data.previewUrl);
            setIsDeploying(false);
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Failed to check deployment status:', error);
        }
      }, 10000); // Poll every 10 seconds

      // Stop polling after 5 minutes
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setIsDeploying(false);
      }, 300000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [prototypeId, previewUrl]);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  if (isDeploying) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Deploying...
          </h3>
          <p className="text-gray-600 mb-2">
            Your preview is being deployed
          </p>
          <p className="text-sm text-gray-500">
            Usually takes 1-2 minutes
          </p>
        </div>
      </div>
    );
  }

  if (!currentUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Deployment Failed
          </h3>
          <p className="text-gray-600 mb-6">
            The preview deployment did not complete successfully. Please check the logs in Vercel.
          </p>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            View Vercel Logs ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Preview Controls */}
      <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-200 rounded-md"
            title="Refresh preview"
          >
            🔄
          </button>
          <span className="text-xs text-gray-600 truncate max-w-md">
            {currentUrl}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(currentUrl)}
            className="p-2 hover:bg-gray-200 rounded-md text-xs"
            title="Copy URL"
          >
            📋
          </button>
        </div>
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Open in new tab ↗
        </a>
      </div>

      {/* Preview Iframe */}
      <div className="flex-1 bg-white">
        <iframe
          key={key}
          src={currentUrl}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          title="Preview"
        />
      </div>
    </div>
  );
}

