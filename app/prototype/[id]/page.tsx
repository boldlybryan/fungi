import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import V0ChatPanel from '@/components/V0ChatPanel';
import PreviewPanel from '@/components/PreviewPanel';

export default async function PrototypeWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  const prototype = await prisma.prototype.findUnique({
    where: { id },
    include: { previewDatabase: true },
  });

  if (!prototype) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Prototype Not Found
          </h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check ownership
  if (prototype.createdById !== user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this prototype
          </p>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isReadOnly = prototype.status === 'SUBMITTED' || prototype.status === 'MERGED';

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
          <div className="border-l pl-4">
            <p className="text-sm text-gray-600 line-clamp-1">
              {prototype.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {prototype.previewUrl ? (
            <a
              href={prototype.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
            >
              Preview ↗
            </a>
          ) : (
            <span className="text-sm text-yellow-600">Deploying...</span>
          )}
          
          {!isReadOnly && prototype.previewUrl && (
            <Link
              href={`/prototype/${prototype.id}/submit`}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Submit for Review
            </Link>
          )}
          
          {isReadOnly && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {prototype.status}
            </span>
          )}
        </div>
      </div>

      {/* Split Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - v0 Chat */}
        <div className="w-1/2 border-r">
          <V0ChatPanel
            prototypeId={prototype.id}
            v0ProjectId={prototype.v0ProjectId}
            isReadOnly={isReadOnly}
            prNumber={prototype.prNumber}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2">
          <PreviewPanel
            prototypeId={prototype.id}
            previewUrl={prototype.previewUrl}
            branchName={prototype.branchName}
          />
        </div>
      </div>
    </div>
  );
}

