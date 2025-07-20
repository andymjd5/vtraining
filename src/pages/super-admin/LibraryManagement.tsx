import React, { useState, useEffect, useCallback } from 'react';
import { getLibraryResources, assignResourceToCompanies } from '../../services/libraryService';
import { LibraryResource } from '../../types/library';
import { UploadResourceForm } from '../../components/library/UploadResourceForm';
import { LibraryResourceList } from '../../components/library/LibraryResourceList';
import { AssignResourceModal } from '../../components/library/AssignResourceModal';
import LoadingScreen from '../../components/ui/LoadingScreen';

const LibraryManagementPage: React.FC = () => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedResources = await getLibraryResources();
      setResources(fetchedResources);
    } catch (error) {
      console.error("Erreur lors de la récupération des ressources: ", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleUploadSuccess = (newResource: LibraryResource) => {
    fetchResources();
    setSelectedResource(newResource);
    setIsAssignModalOpen(true);
  };

  const openAssignModal = (resource: LibraryResource) => {
    setSelectedResource(resource);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setSelectedResource(null);
    setIsAssignModalOpen(false);
  };

  const handleAssignment = () => {
    fetchResources();
    closeAssignModal();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gestion de la Bibliothèque</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <UploadResourceForm onUploadSuccess={handleUploadSuccess} />
        </div>
        <div className="md:col-span-2">
          <LibraryResourceList resources={resources} onAssignClick={openAssignModal} />
        </div>
      </div>
      {selectedResource && (
        <AssignResourceModal
          resource={selectedResource}
          isOpen={isAssignModalOpen}
          onClose={closeAssignModal}
          onAssigned={handleAssignment}
        />
      )}
    </div>
  );
};

export default LibraryManagementPage;