'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubmitPrototypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ prNumber: number; prUrl: string } | null>(null);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/prototype/${id}/submit`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit prototype');
        return;
      }

      setSuccess({
        prNumber: data.prNumber,
        prUrl: data.prUrl,
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/prototype/${id}`);
      }, 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pull Request Created Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your prototype has been submitted for review as PR #{success.prNumber}
          </p>
          <a
            href={success.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-semibold mb-4"
          >
            View Pull Request ↗
          </a>
          <p className="text-sm text-gray-500">
            Redirecting to workspace in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-8">
        <div className="flex items-center mb-6">
          <span className="text-4xl mr-4">📤</span>
          <h2 className="text-3xl font-bold text-gray-900">
            Submit Prototype for Review
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This will create a Pull Request in GitHub. Once submitted, you won&apos;t be able
            to make further changes to this prototype.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              What happens next:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✅ A Pull Request will be created in GitHub</li>
              <li>✅ Your team can review the changes</li>
              <li>✅ The preview will remain accessible</li>
              <li>✅ The workspace will become read-only</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 mr-3"
            />
            <span className="text-sm text-gray-700">
              I confirm this prototype is ready for review and understand that no
              further changes can be made after submission
            </span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={`/prototype/${id}`}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!confirmed || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Pull Request...' : 'Submit PR'}
          </button>
        </div>
      </div>
    </div>
  );
}

