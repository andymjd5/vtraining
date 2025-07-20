import React, { useState } from 'react';
import { LibraryResource } from '../../types/library';
import { File, Video, Image } from 'lucide-react';
import { ResourcePlayerModal } from './ResourcePlayerModal';

interface StudentResourceViewerProps {
  resources: LibraryResource[];
}

export const StudentResourceViewer: React.FC<StudentResourceViewerProps> = ({ resources }) => {
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openResource = (resource: LibraryResource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const closeResource = () => {
    setSelectedResource(null);
    setIsModalOpen(false);
  };

  const getIconForType = (type: string) => {
    if (type.includes('pdf')) return <File className="h-12 w-12 text-red-500" />;
    if (type.includes('mp4')) return <Video className="h-12 w-12 text-blue-500" />;
    if (['jpg', 'jpeg', 'png'].includes(type)) return <Image className="h-12 w-12 text-green-500" />;
    return <File className="h-12 w-12 text-gray-500" />;
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {resources.map((resource) => (
          <div 
            key={resource.id} 
            className="border rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => openResource(resource)}
          >
            <div className="mb-4">
              {getIconForType(resource.fileType)}
            </div>
            <h4 className="font-semibold text-gray-800">{resource.fileName}</h4>
          </div>
        ))}
      </div>

      {selectedResource && (
        <ResourcePlayerModal
          resource={selectedResource}
          isOpen={isModalOpen}
          onClose={closeResource}
        />
      )}
    </div>
  );
};