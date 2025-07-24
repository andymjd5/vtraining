import React, { useState, useEffect, useCallback } from 'react';
import { getLibraryResources } from '../../services/libraryService';
import { LibraryResource } from '../../types/library';
import { Company } from '../../types';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { UploadResourceForm } from '../../components/library/UploadResourceForm';
import { LibraryResourceList } from '../../components/library/LibraryResourceList';
import { AssignResourceModal } from '../../components/library/AssignResourceModal';
import LoadingScreen from '../../components/ui/LoadingScreen';

const LibraryManagementPage: React.FC = () => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);

  const fetchResourcesAndCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const resourcesPromise = getLibraryResources();
      const companiesPromise = getDocs(collection(db, 'companies'));
      
      const [fetchedResources, companySnapshot] = await Promise.all([resourcesPromise, companiesPromise]);
      
      setResources(fetchedResources);
      const companyList = companySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(companyList);

    } catch (error) {
      console.error("Erreur lors de la récupération des données: ", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResourcesAndCompanies();
  }, [fetchResourcesAndCompanies]);

  const handleUploadSuccess = (newResource: LibraryResource) => {
    fetchResourcesAndCompanies();
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
    fetchResourcesAndCompanies();
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
          <LibraryResourceList resources={resources} companies={companies} onAssignClick={openAssignModal} />
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