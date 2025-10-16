'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePrototypeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const charCount = description.length;
  const isValid = charCount >= 10 && charCount <= 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValid) {
      setError('Description must be between 10 and 500 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/prototype', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create prototype');
        return;
      }

      // Success - redirect to workspace
      router.push(`/prototype/${data.id}`);
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Prototype</h2>
        <p className="text-gray-600 mb-4">
          Describe what you want to build. You can modify the landing page, example
          pages, and UI components.
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Add a contact form to the landing page with name, email, and message fields"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              autoFocus
            />
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                💡 <strong>What you can modify:</strong> Landing page, example blog
                pages, UI components
                <br />
                ⚠️ <strong>What you cannot modify:</strong> Dashboard, authentication
                pages, core system files
              </div>
              <span
                className={`text-sm ${
                  charCount === 0
                    ? 'text-gray-500'
                    : charCount < 10
                    ? 'text-orange-600'
                    : charCount > 500
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {charCount} / 500
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

