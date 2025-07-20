import React from 'react';
import { LibraryResource } from '../../types/library';
import { X } from 'lucide-react';

interface ResourcePlayerModalProps {
  resource: LibraryResource;
  isOpen: boolean;
  onClose: () => void;
}

export const ResourcePlayerModal: React.FC<ResourcePlayerModalProps> = ({ resource, isOpen, onClose }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
    };

    switch (resource.fileType) {
      case 'pdf':
        return (
          <iframe
            src={`${resource.filePath}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full"
            onContextMenu={handleContextMenu}
          />
        );
      case 'mp4':
        return (
          <video
            src={resource.filePath}
            controls
            controlsList="nodownload"
            className="w-full h-full"
            onContextMenu={handleContextMenu}
          />
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <img
            src={resource.filePath}
            alt={resource.fileName}
            className="w-full h-full object-contain"
            onContextMenu={handleContextMenu}
          />
        );
      default:
        return <p>Type de fichier non supporté.</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onContextMenu={(e) => e.preventDefault()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 relative">
        <button onClick={onClose} className="absolute -top-4 -right-4 bg-white rounded-full p-2 z-10">
          <X className="h-6 w-6 text-black" />
        </button>
        <div className="p-4 h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};