import React, { useState, useEffect } from 'react';
import { Company } from '../../types';
import { getCompanies } from '../../services/companyService';
import { assignResourceToCompanies } from '../../services/libraryService';
import { Button } from '../ui/Button';
import { LibraryResource } from '../../types/library';
import { useToast } from '../../hooks/useToast';

interface AssignResourceModalProps {
  resource: LibraryResource;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssignResourceModal: React.FC<AssignResourceModalProps> = ({ resource, isOpen, onClose, onAssigned }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      getCompanies().then(setCompanies);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && companies.length > 0) {
        const assignedCompanies = resource.assignedToCompanies || [];
        if (assignedCompanies.length === companies.length && companies.length > 0) {
            setSelectAll(true);
            setSelectedCompanies(companies.map(c => c.id));
        } else if (assignedCompanies.length === 1 && assignedCompanies[0] === 'all') {
            setSelectAll(true);
            setSelectedCompanies(companies.map(c => c.id));
        }
        else {
            setSelectAll(false);
            setSelectedCompanies(assignedCompanies);
        }
    }
  }, [isOpen, resource, companies]);

  const handleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => {
      const newSelection = prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId];
      setSelectAll(newSelection.length === companies.length);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCompanies([]);
      setSelectAll(false);
    } else {
      const allCompanyIds = companies.map(c => c.id);
      setSelectedCompanies(allCompanyIds);
      setSelectAll(true);
    }
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    try {
      let assignmentValue: string[] = selectedCompanies;
      if (selectAll) {
        assignmentValue = ['all'];
      }
      
      await assignResourceToCompanies(resource.id, assignmentValue);
      success('Ressource assignée avec succès.');
      onAssigned();
      onClose();
    } catch (err) {
      console.error("Erreur lors de l'assignation: ", err);
      error("Erreur lors de l'assignation de la ressource.");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Assigner "{resource.fileName}"</h2>
        <div className="mb-4 max-h-60 overflow-y-auto">
          <div className="flex items-center mb-3 border-b pb-2">
            <input
              type="checkbox"
              id="select-all-companies"
              checked={selectAll}
              onChange={handleSelectAll}
              className="mr-2"
            />
            <label htmlFor="select-all-companies" className="font-semibold">Sélectionner toutes les entreprises</label>
          </div>
          {companies.map(company => (
            <div key={company.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`company-${company.id}`}
                checked={selectedCompanies.includes(company.id)}
                onChange={() => handleCompanySelection(company.id)}
                className="mr-2"
              />
              <label htmlFor={`company-${company.id}`}>{company.name}</label>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-4">
          <Button onClick={onClose} variant="outlined">Annuler</Button>
          <Button onClick={handleAssign} disabled={isAssigning}>
            {isAssigning ? 'Assignation...' : 'Assigner'}
          </Button>
        </div>
      </div>
    </div>
  );
};