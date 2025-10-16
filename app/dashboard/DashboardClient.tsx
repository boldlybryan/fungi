'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CreatePrototypeModal from '@/components/CreatePrototypeModal';
import DeletePrototypeModal from '@/components/DeletePrototypeModal';

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletePrototype, setDeletePrototype] = useState<{
    id: string;
    description: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get('create')) {
      setShowCreateModal(true);
    }
    const deleteId = searchParams.get('delete');
    if (deleteId) {
      // In a real app, we'd fetch the prototype details
      // For now, we'll handle this via the server component
      setDeletePrototype({
        id: deleteId,
        description: 'Loading...',
        status: 'IN_PROGRESS',
      });
    }
  }, [searchParams]);

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    router.push('/dashboard');
  };

  const handleCloseDeleteModal = () => {
    setDeletePrototype(null);
    router.push('/dashboard');
  };

  return (
    <>
      {children}
      <CreatePrototypeModal isOpen={showCreateModal} onClose={handleCloseCreateModal} />
      {deletePrototype && (
        <DeletePrototypeModal
          prototypeId={deletePrototype.id}
          description={deletePrototype.description}
          status={deletePrototype.status}
          isOpen={true}
          onClose={handleCloseDeleteModal}
        />
      )}
    </>
  );
}

