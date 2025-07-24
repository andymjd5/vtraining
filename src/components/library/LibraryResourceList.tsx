import React, { useState } from 'react';
import { LibraryResource } from '../../types/library';
import { Company } from '../../types';
import { Button } from '../ui/Button';

interface LibraryResourceListProps {
  resources: LibraryResource[];
  companies: Company[];
  onAssignClick: (resource: LibraryResource) => void;
}

export const LibraryResourceList: React.FC<LibraryResourceListProps> = ({ resources, companies, onAssignClick }) => {
  
  const getCompanyNames = (companyIds: string[] | undefined) => {
    if (!companyIds) return 'Aucune';
    if (companyIds.includes('all')) return 'Toutes les entreprises';
    if (companyIds.length === 0) return 'Aucune';

    return companyIds.map(id => {
      const company = companies.find(c => c.id === id);
      return company ? company.name : 'Inconnue';
    }).join(', ');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Ressources de la bibliothèque</h3>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCompanyNames(resource.assignedToCompanies)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button onClick={() => onAssignClick(resource)} size="sm">
                    Assigner
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};