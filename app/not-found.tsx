import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

