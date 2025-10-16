import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import DashboardClient from './DashboardClient';

type FilterStatus = 'ALL' | 'IN_PROGRESS' | 'SUBMITTED' | 'MERGED' | 'ARCHIVED';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; search?: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const filter = (params.filter?.toUpperCase() || 'ALL') as FilterStatus;
  const search = params.search || '';

  // Build query
  const where: any = {
    createdById: user.id,
  };

  if (filter !== 'ALL') {
    where.status = filter;
  }

  if (search) {
    where.description = {
      contains: search,
      mode: 'insensitive',
    };
  }

  const prototypes = await prisma.prototype.findMany({
    where,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const statusCounts = await prisma.prototype.groupBy({
    by: ['status'],
    where: {
      createdById: user.id,
    },
    _count: true,
  });

  const counts = {
    ALL: prototypes.length,
    IN_PROGRESS: statusCounts.find(s => s.status === 'IN_PROGRESS')?._count || 0,
    SUBMITTED: statusCounts.find(s => s.status === 'SUBMITTED')?._count || 0,
    MERGED: statusCounts.find(s => s.status === 'MERGED')?._count || 0,
    ARCHIVED: statusCounts.find(s => s.status === 'ARCHIVED')?._count || 0,
  };

  return (
    <DashboardClient>
      <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Fungi
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Prototypes</h1>
          <Link
            href="/dashboard?create=true"
            className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold inline-flex items-center"
          >
            <span className="mr-2">+</span>
            Create New Prototype
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-2 mb-4">
            {(['ALL', 'IN_PROGRESS', 'SUBMITTED', 'MERGED', 'ARCHIVED'] as FilterStatus[]).map((status) => (
              <Link
                key={status}
                href={`/dashboard?filter=${status}`}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border`}
              >
                {status.replace('_', ' ')} ({counts[status]})
              </Link>
            ))}
          </div>

          {/* Search */}
          <form method="GET" action="/dashboard">
            <input type="hidden" name="filter" value={filter} />
            <input
              type="text"
              name="search"
              placeholder="Search prototypes..."
              defaultValue={search}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>

        {/* Prototype Count */}
        <p className="text-sm text-gray-600 mb-4">
          Showing {prototypes.length} prototype{prototypes.length !== 1 ? 's' : ''}
        </p>

        {/* Prototypes Grid */}
        {prototypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {search ? 'No prototypes found' : 'No prototypes yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {search
                ? 'Try adjusting your search or filters'
                : 'Create your first prototype to get started'}
            </p>
            {!search && (
              <div className="space-y-2 max-w-md mx-auto text-sm text-gray-600">
                <p>💡 Try: &quot;Add a contact form to the landing page&quot;</p>
                <p>💡 Try: &quot;Change the blog layout to a grid&quot;</p>
                <p>💡 Try: &quot;Add a dark mode toggle&quot;</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prototypes.map((prototype) => (
              <div
                key={prototype.id}
                className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium line-clamp-2 mb-2">
                      {prototype.description}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-semibold rounded ${
                      prototype.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : prototype.status === 'SUBMITTED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : prototype.status === 'MERGED'
                        ? 'bg-green-100 text-green-800'
                        : prototype.status === 'ERROR'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {prototype.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>Created {new Date(prototype.createdAt).toLocaleDateString()}</p>
                  <p>Updated {new Date(prototype.updatedAt).toLocaleDateString()}</p>
                  {prototype.previewUrl && (
                    <a
                      href={prototype.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      View Preview ↗
                    </a>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    href={`/prototype/${prototype.id}`}
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium text-center"
                  >
                    Open
                  </Link>
                  {prototype.status !== 'SUBMITTED' && prototype.status !== 'MERGED' && (
                    <Link
                      href={`/dashboard?delete=${prototype.id}`}
                      className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      🗑️
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </DashboardClient>
  );
}

