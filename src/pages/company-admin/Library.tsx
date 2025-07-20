import React, { useState, useEffect, useCallback } from 'react';
import { getCompanyAssignedResources } from '../../services/libraryService';
import { LibraryResource } from '../../types/library';
import { useAuth } from '../../hooks/useAuth';
import { CompanyResourceViewer } from '../../components/library/CompanyResourceViewer';
import LoadingScreen from '../../components/ui/LoadingScreen';

const CompanyLibraryPage: React.FC = () => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchResources = useCallback(async () => {
    if (!user?.companyId) return;
    setIsLoading(true);
    try {
      const fetchedResources = await getCompanyAssignedResources(user.companyId);
      setResources(fetchedResources);
    } catch (error) {
      console.error("Erreur lors de la récupération des ressources de l'entreprise: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Bibliothèque de l'entreprise</h1>
      <CompanyResourceViewer resources={resources} />
    </div>
  );
};

export default CompanyLibraryPage;