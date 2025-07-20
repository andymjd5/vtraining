import React, { useState, useEffect, useCallback } from 'react';
import { getStudentAssignedResources } from '../../services/libraryService';
import { LibraryResource } from '../../types/library';
import { useAuth } from '../../hooks/useAuth';
import { StudentResourceViewer } from '../../components/library/StudentResourceViewer';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { BookOpen, Clock, AlertCircle } from 'lucide-react';

const StudentLibraryPage: React.FC = () => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchResources = useCallback(async () => {
    if (!user?.uid || !user?.companyId) return;
    setIsLoading(true);
    try {
      const fetchedResources = await getStudentAssignedResources(user.uid, user.companyId);
      setResources(fetchedResources);
    } catch (error) {
      console.error("Erreur lors de la récupération des ressources de l'étudiant: ", error);
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
      <h1 className="text-3xl font-bold mb-6">Ma Bibliothèque</h1>
      
      {resources.length > 0 ? (
        <StudentResourceViewer resources={resources} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-gray-50 rounded-full p-6 mb-6">
            <BookOpen className="h-16 w-16 text-gray-400" />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
            Votre bibliothèque est actuellement vide
          </h2>
          
          <p className="text-gray-600 text-center mb-6 max-w-md">
            Aucune ressource ne vous a été assignée pour le moment. 
            Les documents et ressources d'apprentissage apparaîtront ici une fois qu'ils vous seront attribués.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  En attente d'attribution
                </h3>
                <p className="text-sm text-blue-700">
                  Votre administrateur d'entreprise peut vous assigner des ressources depuis son tableau de bord.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            Cette page se mettra à jour automatiquement lorsque de nouvelles ressources seront disponibles.
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLibraryPage;