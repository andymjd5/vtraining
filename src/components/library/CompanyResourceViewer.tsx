import React, { useState, useEffect } from 'react';
import { LibraryResource } from '../../types/library';
import { Button } from '../ui/Button';
import { AssignToStudentsModal } from './AssignToStudentsModal';
import { getResourceAssignmentsForCompany } from '../../services/libraryService';
import { useAuth } from '../../hooks/useAuth';

interface CompanyResourceViewerProps {
  resources: LibraryResource[];
}

export const CompanyResourceViewer: React.FC<CompanyResourceViewerProps> = ({ resources }) => {
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const { user } = useAuth();

  const fetchAssignments = async () => {
    if (!user?.companyId) return;
    const newAssignments: Record<string, number> = {};
    for (const resource of resources) {
      const studentIds = await getResourceAssignmentsForCompany(resource.id, user.companyId);
      newAssignments[resource.id] = studentIds.length;
    }
    setAssignments(newAssignments);
  };

  useEffect(() => {
    fetchAssignments();
  }, [resources, user]);

  const openAssignModal = (resource: LibraryResource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const closeAssignModal = () => {
    setSelectedResource(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Ressources disponibles pour votre entreprise</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du fichier</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigné à</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{resource.fileName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.fileType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignments[resource.id] || 0} étudiant(s)</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button onClick={() => openAssignModal(resource)} size="sm">
                    Gérer l'assignation
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedResource && (
        <AssignToStudentsModal
          resource={selectedResource}
          isOpen={isModalOpen}
          onClose={closeAssignModal}
          onAssigned={() => {
            fetchAssignments();
            closeAssignModal();
          }}
        />
      )}
    </div>
  );
};