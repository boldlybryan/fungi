'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeletePrototypeModal({
  prototypeId,
  description,
  status,
  isOpen,
  onClose,
}: {
  prototypeId: string;
  description: string;
  status: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canDelete = status !== 'SUBMITTED' && status !== 'MERGED';
  const isConfirmed = confirmText.toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/prototype/${prototypeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete prototype');
        return;
      }

      // Success - close modal and refresh
      onClose();
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
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">⚠️</span>
          <h2 className="text-2xl font-bold">Delete Prototype?</h2>
        </div>

        {!canDelete ? (
          <div>
            <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
              Cannot delete submitted or merged prototypes
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              This will permanently delete the branch, database, and all changes. This
              action cannot be undone.
            </p>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 italic">&quot;{description}&quot;</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="DELETE"
              />
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
                onClick={handleDelete}
                disabled={!isConfirmed || loading}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

