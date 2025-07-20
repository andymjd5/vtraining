import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { uploadResource } from '../../services/libraryService';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';

import { LibraryResource } from '../../types/library';

interface UploadResourceFormProps {
  onUploadSuccess: (newResource: LibraryResource) => void;
}

export const UploadResourceForm: React.FC<UploadResourceFormProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const newResource = await uploadResource(file, user.uid);
      success('Ressource uploadée avec succès.');
      setFile(null);
      onUploadSuccess(newResource);
    } catch (err) {
      console.error("Erreur lors de l'upload: ", err);
      showError("Erreur lors de l'upload de la ressource.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Uploader une nouvelle ressource</h3>
      <div className="mb-4">
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          accept=".pdf,.mp4,.jpg,.jpeg,.png"
        />
      </div>
      <Button type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Upload en cours...' : 'Uploader'}
      </Button>
    </form>
  );
};