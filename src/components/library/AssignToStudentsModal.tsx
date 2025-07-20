import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { assignResourceToStudents, getResourceAssignmentsForCompany } from '../../services/libraryService';
import { Button } from '../ui/Button';
import { LibraryResource } from '../../types/library';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface AssignToStudentsModalProps {
  resource: LibraryResource;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssignToStudentsModal: React.FC<AssignToStudentsModalProps> = ({ resource, isOpen, onClose, onAssigned }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const { user } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && user?.companyId) {
      userService.getStudentsByCompany(user.companyId).then(setStudents);
      getResourceAssignmentsForCompany(resource.id, user.companyId).then(assignedStudents => {
        setSelectedStudents(assignedStudents);
      });
    }
  }, [isOpen, user, resource.id]);

  useEffect(() => {
    if (students.length > 0) {
        setSelectAll(selectedStudents.length === students.length);
    }
  }, [selectedStudents, students]);

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const handleAssign = async () => {
    if (!user?.companyId || !user?.id) return;
    setIsAssigning(true);
    try {
      await assignResourceToStudents(resource.id, selectedStudents, user.companyId, user.id);
      success('Ressource assignée avec succès aux étudiants.');
      onAssigned();
      onClose();
    } catch (err) {
      console.error("Erreur lors de l'assignation aux étudiants: ", err);
      error("Erreur lors de l'assignation de la ressource.");
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Assigner "{resource.fileName}" aux étudiants</h2>
        <div className="mb-4 max-h-60 overflow-y-auto">
          <div className="flex items-center mb-3 border-b pb-2">
            <input
              type="checkbox"
              id="select-all-students"
              checked={selectAll}
              onChange={handleSelectAll}
              className="mr-2"
            />
            <label htmlFor="select-all-students" className="font-semibold">Sélectionner tous les étudiants</label>
          </div>
          {students.map(student => (
            <div key={student.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`student-${student.id}`}
                checked={selectedStudents.includes(student.id)}
                onChange={() => handleStudentSelection(student.id)}
                className="mr-2"
              />
              <label htmlFor={`student-${student.id}`}>{student.name}</label>
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